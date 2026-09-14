using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using SeoulKenshi.Contents.Social;
using SeoulKenshi.Protocols.WCF.Social;

namespace SeoulKenshi.GameServer.Service.Social
{
    internal static class SocialRuntime
    {
        static readonly ConcurrentDictionary<long, EventLog> Events =
            new ConcurrentDictionary<long, EventLog>();

        static readonly AllianceRegistry Alliances = new AllianceRegistry();

        public static void AddEvent(long accountIdx, DateTime now, string type, string body)
        {
            var log = Events.GetOrAdd(accountIdx, _ => new EventLog());
            log.Add(new EventLogEntry(now, type, body));
        }

        public static IReadOnlyList<EventLogEntry> GetEvents(long accountIdx, int count)
        {
            if (!Events.TryGetValue(accountIdx, out var log))
                return Array.Empty<EventLogEntry>();

            var take = count <= 0 ? int.MaxValue : count;
            return log.GetRecent(take);
        }

        public static AllianceStub CreateAlliance(string name, long accountIdx)
        {
            return Alliances.Create(name, accountIdx);
        }

        public static AllianceStub JoinAlliance(string name, long accountIdx)
        {
            return Alliances.Join(name, accountIdx);
        }

        public static AlliancePacket ToPacket(AllianceStub alliance)
        {
            return new AlliancePacket
            {
                Name = alliance.Name,
                Members = new List<long>(alliance.Members)
            };
        }

        public static EventLogPacket ToPacket(EventLogEntry entry)
        {
            return new EventLogPacket
            {
                OccurredAt = entry.OccurredAt.Ticks,
                Type = entry.Type,
                Body = entry.Body
            };
        }
    }
}
