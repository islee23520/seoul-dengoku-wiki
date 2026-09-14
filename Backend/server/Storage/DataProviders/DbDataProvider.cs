using System;
using System.Threading.Tasks;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.DB;
using SeoulKenshi.DB.GameDB;

namespace SeoulKenshi.Storage.DataProviders
{
    public sealed class DbDataProvider : DataProvider
    {
        public override UserData GetData(StorageParameter param)
        {
            var dbParam = param as DataBaseStorageParameter;
            if (dbParam == null)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"Invalid parameter type: expected {nameof(DataBaseStorageParameter)}, got {param?.GetType().Name}");
            }

            var result = new UserData(dbParam.AuthInfo.UID);

            var storages = GetDataStorages(dbParam.Types);

            using (var db = new GameDBConnector(DBConfig.GetGameDBString(dbParam.AuthInfo.GameDB)))
            {
                dbParam.DbConnector = db;

                foreach (var storage in storages)
                {
                    var data = storage.GetData(dbParam);

                    if (storage.StorageType == UserDataType.Account && data == null)
                    {
                        return null;
                    }

                    result.Data.Add(storage.StorageType, data);
                }
            }

            return result;
        }

        public override Task<UserData> GetDataAsync(StorageParameter param)
        {
            return Task.FromResult(GetData(param));
        }

        public UserData Create(StorageParameter param)
        {
            var dbParam = param as DataBaseStorageParameter;
            if (dbParam == null)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"Invalid parameter type: expected {nameof(DataBaseStorageParameter)}, got {param?.GetType().Name}");
            }

            var result = new UserData(dbParam.AuthInfo.UID);

            var storages = GetDataStorages(dbParam.Types);

            using (var db = new GameDBConnector(DBConfig.GetGameDBString(dbParam.AuthInfo.GameDB), true))
            {
                dbParam.DbConnector = db;

                foreach (var storage in storages)
                {
                    var creator = storage as ICreateData;
                    if (creator == null)
                    {
                        throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"Storage {storage.StorageType} does not implement {nameof(ICreateData)}");
                    }

                    result.Data.Add(storage.StorageType, creator.Create(dbParam));
                }

                db.Commit();
            }

            return result;
        }
    }
}