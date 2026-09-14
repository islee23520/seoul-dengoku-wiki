namespace SeoulKenshi.GameServer.EnterLobby
{
    public interface IEnterLobbyOperator
    {
        void Process(ref EnterLobbyParameter param);
    }
}
