using System;
using System.Collections.Generic;

namespace SeoulKenshi.Contents.Social
{
    /// <summary>
    /// 동맹 스텁. 이름·멤버 목록·가입/탈퇴.
    /// </summary>
    public sealed class AllianceStub
    {
        readonly List<long> _members = new List<long>();

        public string Name { get; }
        public IReadOnlyList<long> Members => _members;

        internal AllianceStub(string name, long founderAccountIdx)
        {
            Name = name;
            _members.Add(founderAccountIdx);
        }

        public void Join(long accountIdx)
        {
            if (_members.Contains(accountIdx))
            {
                throw new InvalidOperationException($"Already a member: {accountIdx}");
            }

            _members.Add(accountIdx);
        }

        public void Leave(long accountIdx)
        {
            if (!_members.Remove(accountIdx))
            {
                throw new InvalidOperationException($"Not a member: {accountIdx}");
            }
        }
    }

    /// <summary>
    /// 동맹 생성. 최소 검증: 중복 이름 금지 (대소문자 무시, trim).
    /// </summary>
    public sealed class AllianceRegistry
    {
        readonly Dictionary<string, AllianceStub> _byName =
            new Dictionary<string, AllianceStub>(StringComparer.OrdinalIgnoreCase);

        public AllianceStub Create(string name, long founderAccountIdx)
        {
            var normalized = NormalizeName(name);
            if (_byName.ContainsKey(normalized))
            {
                throw new InvalidOperationException($"Duplicate alliance name: {normalized}");
            }

            var alliance = new AllianceStub(normalized, founderAccountIdx);
            _byName.Add(normalized, alliance);
            return alliance;
        }

        public AllianceStub Get(string name)
        {
            var normalized = NormalizeName(name);
            if (!_byName.TryGetValue(normalized, out var alliance))
            {
                throw new InvalidOperationException($"Alliance not found: {normalized}");
            }

            return alliance;
        }

        public AllianceStub Join(string name, long accountIdx)
        {
            var alliance = Get(name);
            alliance.Join(accountIdx);
            return alliance;
        }

        public AllianceStub Leave(string name, long accountIdx)
        {
            var alliance = Get(name);
            alliance.Leave(accountIdx);
            return alliance;
        }

        static string NormalizeName(string name)
        {
            if (name == null)
            {
                throw new ArgumentNullException(nameof(name));
            }

            var trimmed = name.Trim();
            if (trimmed.Length == 0)
            {
                throw new ArgumentException("Alliance name is empty.", nameof(name));
            }

            return trimmed;
        }
    }
}
