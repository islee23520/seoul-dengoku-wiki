using System;
using System.Collections.Generic;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Reward;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.GameServer.EnterLobby
{
    public class EnterLobbyParameter
    {
        public List<Entity> Entities = new List<Entity>();

        public List<GiveRewardParam> RewardParams = new List<GiveRewardParam>();

        public UserData UserData { get; set; }

        public DateTime Now { get; set; }

        public int ChangeDayCount { get; }
        public bool IsChangeWeek { get; }
        public bool IsChangeMonth { get; }


        public EnterLobbyParameter(UserData userData)
        {
            Now = DateTime.Now;
            UserData = userData;

            var account = userData.GetData<Account>();
            (ChangeDayCount, IsChangeWeek, IsChangeMonth) = account.CheckChangeDayFromLastLogin(Now);
            if (ChangeDayCount > 0)
            {
                Entities.Add(account.GetEntity(DbCommandType.Update));
            }
        }
    }
}
