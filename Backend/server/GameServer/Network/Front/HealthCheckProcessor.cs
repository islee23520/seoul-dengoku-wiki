namespace SeoulKenshi.GameServer.Service.Front
{
    public partial class CService : IService
    {
        public string HealthCheckProcessor()
        {
            return "SUCCESS";
        }
    }
}
