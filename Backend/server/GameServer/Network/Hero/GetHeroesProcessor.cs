using System;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Inventory;
using SeoulKenshi.GameServer.Extensions;
using SeoulKenshi.Protocols.WCF.Hero;
using SeoulKenshi.Storage;

namespace SeoulKenshi.GameServer.Service.Hero
{
    public partial class CService : AbstractService, IService
    {
        public ReqGetHeroesResult GetHeroesProcessor(ReqGetHeroes req)
        {
            var result = new ReqGetHeroesResult();

            try
            {
                PreProcess(req);

                var userData = UserDataProvider.Instance.GetData(req.AccountIdx, UserDataType.HeroInventory);
                var inventory = userData.GetData<HeroInventory>();

                if (req.PageNum == 0)
                    result.Data = inventory.GetHeros().ToPacket();
                else
                    result.Data = inventory.GetHeros(req.PageNum, req.PageCount).ToPacket();
            }

            catch (Exception e)
            {
                ExceptionHandler(e, result);
            }

            finally
            {
                PostProcess(result);
            }

            return result;
        }
    }
}