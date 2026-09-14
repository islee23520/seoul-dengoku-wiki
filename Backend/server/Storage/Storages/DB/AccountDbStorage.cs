using SeoulKenshi.Common;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.DB;
using SeoulKenshi.DB.GameDB;
using SeoulKenshi.DB.GlobalDB.Entities;
using Y2K.Core.DataBase;
using Y2K.Core.Util;

namespace SeoulKenshi.Storage.DataBase
{
    public class AccountDbStorage : IDataStorage, ICreateData
    {
        public UserDataType StorageType { get { return UserDataType.Account; } }
        public ICacheObject MetaClass { get; } = new Account();

        public ICacheObject Create(StorageParameter argument)
        {
            var param = argument as CreateUserDataParameter;
            if (param == null)
            {
                return null;
            }

            var db = param.DbConnector;

            var account = Account.Create(param.AuthInfo.UID, 1, param.HeroInventoryDefaultSlot, param.EquipmentInventoryDefaultSlot, param.ItemInventoryDefaultSlot, param.Now);

            db.Attach(account.GetEntity(DbCommandType.Insert));

            SetAuthInfo(account, param.AuthInfo, param.ServerRegion);

            #region Account에 종속적인 객체 중 같이 생성되야하는 객체들의 생성 및 insert 코드 위치 
            account.EnergyBag = EnergyBag.Create(db, account.AccountIdx, param.Now);
            #endregion

            return account;
        }

        public ICacheObject GetData(StorageParameter argument)
        {
            var param = argument as DataBaseStorageParameter;
            if (param == null)
            {
                return null;
            }

            var db = param.DbConnector;

            var entity = AccountEntity.LoadFromDB(db.Connection, param.AuthInfo.UID);
            if (entity == null)
                return null;

            var account = new Account(entity);

            SetAuthInfo(account, param.AuthInfo, param.ServerRegion);

            #region Account와 같이 불려질 Entity 객체들을 로드하는 함수들 위치
            account.EnergyBag = EnergyBag.LoadFromDB(db.Connection, account.AccountIdx);
            #endregion

            return account;
        }

        void SetAuthInfo(Account account, AuthInfo authInfo, string serverRegion)
        {
            account.ClientRegion = authInfo.Region;
            account.ServerRegion = serverRegion;

            account.GameDBString = DBConfig.GetGameDBString(authInfo.GameDB);
            account.VID = authInfo.VenderID;
            account.VenderType = authInfo.VenderType;
            account.Nickname = authInfo.Nickname;
            account.StoreType = (StoreType)authInfo.MarketID;
            account.DID = authInfo.DID;
        }
    }
}