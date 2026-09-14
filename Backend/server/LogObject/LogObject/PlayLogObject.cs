using System;
using System.Text.Json;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.LogObject
{
    public abstract class PlayLogObject
    {
        public string vid { get; set; }
        public string vidType { get; set; }
        public string did { get; set; }
        public string clientRegion { get; set; }
        public string serverRegion { get; set; }

        public string category { get; set; }
        public string dateTime { get; set; }
        public DateTime logTime { get; set; }
        public string timezone { get; set; }
        public string indexName { get; set; }

        public long accountIdx { get; set; }
        public short accountLevel { get; set; }
        public string accountName { get; set; }
        public string accountGrade { get; set; }

        public PlayLogObject() { }
        public PlayLogObject(IAccountLog accountLog, string category, DateTime now)
        {
            vid = accountLog.VID;
            vidType = accountLog.VenderType.ToString();

            did = accountLog.DID;
            serverRegion = accountLog.ServerRegion;
            clientRegion = accountLog.ClientRegion;

            this.category = category.ToLower();
            dateTime = now.ToString("yyyy-MM-dd HH:mm:ss.fff");
            logTime = now;

            indexName = $"SeoulKenshi-{now:yyyy-MM-dd}";
            accountIdx = accountLog.AccountIdx;
            accountLevel = accountLog.Level;
            accountName = accountLog.Nickname;
            accountGrade = accountLog.Grade;

            TimeSpan span;
            if (TimeZoneInfo.Local.IsDaylightSavingTime(now) == true)
                span = TimeZoneInfo.Local.BaseUtcOffset + new TimeSpan(1, 0, 0);
            else
                span = TimeZoneInfo.Local.BaseUtcOffset;

            if (span.TotalHours >= 0)
                timezone = "UTC+" + span.ToString(@"hh\:mm");
            else
                timezone = "UTC-" + span.ToString(@"hh\:mm");
        }
        public virtual string ToJson()
        {
            return JsonSerializer.Serialize(this, GetType());
        }
    }
}
