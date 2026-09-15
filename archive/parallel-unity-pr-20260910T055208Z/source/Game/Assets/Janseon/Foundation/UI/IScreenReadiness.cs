using System.Threading.Tasks;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Content-screen lease waits on Ready before FSM commit.
    /// </summary>
    public interface IScreenReadiness
    {
        bool IsReady { get; }
        Task Ready { get; }
    }
}
