using System.Runtime.CompilerServices;
using System.Threading.Channels;
using S7Hmi.Core.Interfaces;
using S7Hmi.Core.Models;

namespace S7Hmi.Core.Services;

/// <summary>
/// Высокопроизводительная неблокирующая очередь на базе System.Threading.Channels
/// </summary>
public class ChannelArchiverQueue : IArchiverQueue
{
    private readonly Channel<TagValueUpdate> _channel;

    public ChannelArchiverQueue(int capacity = 100_000)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        };
        _channel = Channel.CreateBounded<TagValueUpdate>(options);
    }

    public ValueTask EnqueueAsync(TagValueUpdate update, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(update, cancellationToken);
    }

    public async ValueTask EnqueueBatchAsync(IEnumerable<TagValueUpdate> updates, CancellationToken cancellationToken = default)
    {
        foreach (var u in updates)
        {
            await _channel.Writer.WriteAsync(u, cancellationToken);
        }
    }

    public async IAsyncEnumerable<IReadOnlyList<TagValueUpdate>> ReadBatchesAsync(
        int maxBatchSize,
        TimeSpan maxWaitTime,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var batch = new List<TagValueUpdate>(maxBatchSize);

        while (!cancellationToken.IsCancellationRequested)
        {
            var startTime = DateTime.UtcNow;

            while (batch.Count < maxBatchSize && (DateTime.UtcNow - startTime) < maxWaitTime)
            {
                if (_channel.Reader.TryRead(out var item))
                {
                    batch.Add(item);
                }
                else
                {
                    if (batch.Count > 0)
                    {
                        break;
                    }

                    // Ожидаем появления хотя бы одного элемента с учетом таймаута
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    cts.CancelAfter(maxWaitTime);
                    try
                    {
                        if (await _channel.Reader.WaitToReadAsync(cts.Token))
                        {
                            if (_channel.Reader.TryRead(out var newItem))
                            {
                                batch.Add(newItem);
                            }
                        }
                    }
                    catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                    {
                        // Вышел таймаут ожидания
                        break;
                    }
                }
            }

            if (batch.Count > 0)
            {
                var result = batch.ToArray();
                batch.Clear();
                yield return result;
            }
        }
    }
}
