using System;
using System.Collections.Generic;
using System.Linq;

namespace SeoulKenshi.Contents.Social
{
    /// <summary>
    /// 소셜 이벤트 한 건. 시각·유형·본문.
    /// </summary>
    public sealed class EventLogEntry
    {
        public DateTime OccurredAt { get; }
        public string Type { get; }
        public string Body { get; }

        public EventLogEntry(DateTime occurredAt, string type, string body)
        {
            if (type == null)
            {
                throw new ArgumentNullException(nameof(type));
            }

            if (body == null)
            {
                throw new ArgumentNullException(nameof(body));
            }

            OccurredAt = occurredAt;
            Type = type;
            Body = body;
        }

        /// <summary>
        /// 시간순(오름차순) 정렬 후 최근 <paramref name="count"/>건.
        /// 동일 시각은 입력 순서를 유지한다.
        /// </summary>
        public static IReadOnlyList<EventLogEntry> TakeRecent(IEnumerable<EventLogEntry> entries, int count)
        {
            if (entries == null)
            {
                throw new ArgumentNullException(nameof(entries));
            }

            if (count < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(count));
            }

            if (count == 0)
            {
                return Array.Empty<EventLogEntry>();
            }

            return entries
                .Select((entry, index) => (entry, index))
                .OrderBy(x => x.entry.OccurredAt)
                .ThenBy(x => x.index)
                .Select(x => x.entry)
                .TakeLast(count)
                .ToList();
        }
    }

    /// <summary>
    /// 인메모리 이벤트 로그. 최근 N개 조회는 시간순.
    /// </summary>
    public sealed class EventLog
    {
        readonly List<EventLogEntry> _entries = new List<EventLogEntry>();

        public void Add(EventLogEntry entry)
        {
            if (entry == null)
            {
                throw new ArgumentNullException(nameof(entry));
            }

            _entries.Add(entry);
        }

        public IReadOnlyList<EventLogEntry> GetRecent(int count)
        {
            return EventLogEntry.TakeRecent(_entries, count);
        }
    }
}
