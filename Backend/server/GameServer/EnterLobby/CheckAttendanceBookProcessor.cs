using SeoulKenshi.Contents.Class;

namespace SeoulKenshi.GameServer.EnterLobby
{
    public class CheckAttendanceBookProcessor : IEnterLobbyOperator
    {
        public void Process(ref EnterLobbyParameter param)
        {
            var account = param.UserData.GetData<Account>();

            // 출석부 처리 블라블라
        }
    }
}
