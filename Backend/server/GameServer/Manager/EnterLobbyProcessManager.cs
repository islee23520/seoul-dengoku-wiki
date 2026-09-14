using System;
using System.Collections.Generic;
using System.Reflection;
using SeoulKenshi.GameServer.EnterLobby;

namespace SeoulKenshi.GameServer.Manager
{
    public class EnterLobbyProcessManager
    {
        Dictionary<Type, IEnterLobbyOperator> operators { get; set; } = new Dictionary<Type, IEnterLobbyOperator>();

        #region Instance
        public static EnterLobbyProcessManager Instance { get; } = new EnterLobbyProcessManager();
        #endregion

        #region 생성자
        public EnterLobbyProcessManager()
        {
            var assembly = Assembly.GetExecutingAssembly();
            foreach (var t in assembly.ExportedTypes)
            {
                var implementedInterfaces = t.GetInterfaces();
                foreach (var implementObject in implementedInterfaces)
                {
                    if (implementObject == typeof(IEnterLobbyOperator))
                    {
                        var enterLobbyOerator = Activator.CreateInstance(t) as IEnterLobbyOperator;
                        var type = enterLobbyOerator.GetType();
                        if (enterLobbyOerator != null && operators.ContainsKey(type) == false)
                            operators.Add(type, enterLobbyOerator);
                    }
                }
            }

        }
        #endregion

        public void StartEnterLobbyProcess(ref EnterLobbyParameter param)
        {
            foreach (var opr in operators.Values)
                opr.Process(ref param);
        }
    }
}