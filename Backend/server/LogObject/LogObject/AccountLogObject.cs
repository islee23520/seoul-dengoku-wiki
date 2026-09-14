using System;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.LogObject
{
    /// <summary>
    /// 계정 생성 로그
    /// </summary>
    public class CreateAccountLogObject : PlayLogObject, ILogObject
    {
        public CreateAccountLogObject() 
            : base() { }

        public CreateAccountLogObject(IAccountLog accountLog, string category, DateTime now)
           : base(accountLog, category, now) { }

        public static CreateAccountLogObject Create(IAccountLog accountLog, DateTime now)
        {
            return new CreateAccountLogObject(accountLog, "account_create", now);
        }
    }

    /// <summary>
    /// 로그인 로그
    /// </summary>
    public class LoginLogObject : PlayLogObject, ILogObject
    {
        public LoginLogObject() : base() { }

        public LoginLogObject(IAccountLog accountLog, string category, DateTime now)
            : base(accountLog, category, now) { }

        public static LoginLogObject Create(IAccountLog accountLog, DateTime now)
        {
            return new LoginLogObject(accountLog, "account_login", now);
        }
    }

    /// <summary>
    /// 닉네임 생성 
    /// </summary>
    public class CreateNickNameLogObject : PlayLogObject, ILogObject
    {
        public CreateNickNameLogObject() : base() { }
        public CreateNickNameLogObject(IAccountLog accountLog, string category, DateTime now)
            : base(accountLog, category, now) { }
        public static CreateNickNameLogObject Create(IAccountLog accountLog, DateTime now)
        {
            return new CreateNickNameLogObject(accountLog, "account_create_nickname", now);
        }

    }

    /// <summary>
    /// 계정 탈퇴
    /// </summary>
    public class UnregistedAccountLogObject : PlayLogObject, ILogObject
    {
        public UnregistedAccountLogObject() : base() { }
        public UnregistedAccountLogObject(IAccountLog accountLog, string category, DateTime now)
            : base(accountLog, category, now) { }

        public static UnregistedAccountLogObject Create(DateTime now, IAccountLog accountLog)
        {
            return new UnregistedAccountLogObject(accountLog, "account_delete", now);
        }
    }

    public class AccountLevelupLogObject : PlayLogObject, ILogObject
    {
        public int beforeLevel { set; get; }
        public int beforeExp { get; set; }
        public int gainExp { get; set; }
        public int nowExp { get; set; }

        public AccountLevelupLogObject() : base() { }

        public AccountLevelupLogObject(IAccountLog accountLog, string category, DateTime now, int beforeExp, short beforeLevel, int gainExp, int nowExp)
            : base(accountLog, category, now)
        {
            this.beforeLevel = beforeLevel;
            this.beforeExp = beforeExp;
            this.gainExp = gainExp;
            this.nowExp = nowExp;
        }

        public static AccountLevelupLogObject Create(IAccountLog accountLog, DateTime now, int beforeExp, short beforeLevel, int gainExp, int nowExp)
        {
            return new AccountLevelupLogObject(accountLog, "account_levelup", now, beforeExp, beforeLevel, gainExp, nowExp);
        }
    }

    public class AccountAttendanceLogObject : PlayLogObject, ILogObject
    {
        public int beforeDay { get; set; }
        public int currentDay { get; set; }

        public AccountAttendanceLogObject() : base() { }

        public AccountAttendanceLogObject(IAccountLog accountLog, string category, DateTime now, int beforeDay, int currentDay)
            : base(accountLog, category, now)
        {
            this.beforeDay = beforeDay;
            this.currentDay = currentDay;
        }

        public static AccountAttendanceLogObject Create(IAccountLog accountLog, DateTime now, int beforeDay, int currentDay)
        {
            return new AccountAttendanceLogObject(accountLog, "account_attendance", now, beforeDay, currentDay);
        }
    }

    public class KeepAliveLogObject : PlayLogObject, ILogObject
    {

        #region 생성자
        public KeepAliveLogObject()
            : base() { }
        public KeepAliveLogObject(IAccountLog accountLog, string category, DateTime now)
            : base(accountLog, category, now) { }
        #endregion

        public static KeepAliveLogObject Create(IAccountLog accountLog, DateTime now)
        {
            return new KeepAliveLogObject(accountLog, "keep_alive", now);
        }
    }


}
