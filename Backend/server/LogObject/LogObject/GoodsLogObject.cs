using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.LogObject
{
    #region 골드 관련
    public class GoldLogObject : PlayLogObject, ILogObject
    {
        public GameLogCause cause { get; set; }
        public long before { set; get; }
        public long after { set; get; }
        public long change { set; get; }

        public GoldLogObject() : base() { }

        public GoldLogObject(IAccountLog accountLog, string category, GameLogCause logCause, long before, long after, long change, DateTime now)
            : base(accountLog, category, now)
        {
            cause = logCause;
            this.before = before;
            this.after = after;
            this.change = change;
        }

        public static GoldLogObject Create(IAccountLog accountLog, GameLogCause logCause, string operation, long before, long after, long change)
        {
            string category;
            if (operation == "+")
                category = "gold_get";
            else
                category = "gold_use";

            return new GoldLogObject(accountLog, category, logCause, before, after, change, DateTime.Now);
        }

        public override string ToJson()
        {
            var o1 = JsonSerializer.SerializeToNode(this, GetType()).AsObject();
            var o2 = JsonSerializer.SerializeToNode(cause).AsObject();
            o2.Remove("Type");

            o1.Remove(nameof(cause));
            foreach (var prop in o2)
                o1[prop.Key] = prop.Value?.DeepClone();

            return o1.ToJsonString();
        }
    }
    #endregion

    #region 캐시 관련 로그
    public class CashLogObject : PlayLogObject, ILogObject
    {
        public GameLogCause cause { get; set; }
        public string cashType { get; set; }
        public long before { set; get; }
        public long after { set; get; }
        public long change { set; get; }

        public CashLogObject() : base() { }

        public CashLogObject(IAccountLog accountLog, string category, GoodsType type, GameLogCause logCause, long before, long after, long change, DateTime now)
            : base(accountLog, category, now)
        {
            cause = logCause;
            cashType = type.ToString().ToLower();
            this.before = before;
            this.after = after;
            this.change = change;
        }

        public static CashLogObject Create(IAccountLog accountLog, GameLogCause logCause, string operation, GoodsType type, long before, long after, long change)
        {
            string category;
            if (operation == "+")
                category = "cash_get";
            else
                category = "cash_use";

            return new CashLogObject(accountLog, category, type, logCause, before, after, change, DateTime.Now);
        }

        public override string ToJson()
        {
            var o1 = JsonSerializer.SerializeToNode(this, GetType()).AsObject();
            var o2 = JsonSerializer.SerializeToNode(cause).AsObject();
            o2.Remove("Type");

            o1.Remove(nameof(cause));
            foreach (var prop in o2)
                o1[prop.Key] = prop.Value?.DeepClone();

            return o1.ToJsonString();
        }
    }
    #endregion
}


