using System;
using UnityEditor;
using UnityEngine;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Data.Authoring;
using Janseon.Data.Validation;

namespace Janseon.Data.Editor
{
    public static class Area1GameDataBuilder
    {
        const string DefaultRoot = "Assets/Janseon/Data/Assets/";
        public static void Build() { BuildAtRoot(DefaultRoot); }
        public static void BuildAtRoot(string root)
        {
            if (string.IsNullOrEmpty(root) || !root.StartsWith("Assets/", StringComparison.Ordinal)) throw new ArgumentException("Asset root must be under Assets.", nameof(root));
            root = root.TrimEnd('/') + "/";
            Ensure(root.TrimEnd('/')); Ensure(root + "Cards"); Ensure(root + "UnitRoles"); Ensure(root + "Formations"); Ensure(root + "Stations");
            var cards = new[] { Card(root,"Card_GuardShieldwall.asset","card.guard-shieldwall","guard-shieldwall",CardKind.Character,300,-3,"front_damage"), Card(root,"Card_EncourageMorale.asset","card.encourage-morale","encourage-morale",CardKind.Character,600,10,"morale"), Card(root,"Card_PincerFocus.asset","card.pincer-focus","pincer-focus",CardKind.Character,450,1,"front_damage"), Card(root,"Card_MobilityRegroup.asset","card.mobility-regroup","mobility-regroup",CardKind.Character,600,1,"cardinal_reposition"), Card(root,"Card_SupplyHeal.asset","card.supply-heal","supply-heal",CardKind.Stronghold,900,5,"front_heal"), Card(root,"Card_PassageRetreat.asset","card.passage-retreat","passage-retreat",CardKind.Stronghold,750,1,"retreat") };
            var roles = new[] { Role(root,"UnitRole_Guard.asset","unit.role.guard","근위",30,4,1,1,10,30), Role(root,"UnitRole_Assault.asset","unit.role.assault","돌격",20,6,1,1,10,30), Role(root,"UnitRole_Archer.asset","unit.role.archer","궁수",14,3,1,3,10,30) };
            var formation = Get<FormationDefinitionAsset>(root + "Formations/Formation_Default3x3.asset"); formation.stableId="formation.default-3x3"; formation.rowCount=3; formation.columnCount=3; formation.slots=new FormationSlotDefinition[6]; for(var i=0;i<6;i++) formation.slots[i]=new FormationSlotDefinition{roleStableId=roles[i/2].stableId,row=i/2,column=i%2-1,facing=CardinalDirection.East}; EditorUtility.SetDirty(formation);
            var stations = new[] { Station(root,"Station_Yeongdeungpo.asset","station.yeongdeungpo","Yeongdeungpo",new[]{"station.sindorim"}), Station(root,"Station_Sindorim.asset","station.sindorim","Sindorim",new[]{"station.yeongdeungpo","station.guro"}), Station(root,"Station_Guro.asset","station.guro","Guro",new[]{"station.sindorim"}) };
            var catalog = Get<GameDataCatalogAsset>(root + "Area1GameDataCatalog.asset"); catalog.contentSchema=1; catalog.contentVersion="area1-static-content-v1"; catalog.fingerprintVersion="content-fingerprint-v1"; catalog.cards=cards; catalog.unitRoles=roles; catalog.formations=new[]{formation}; catalog.stations=stations; EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets(); AssetDatabase.ImportAsset(root + "Area1GameDataCatalog.asset", ImportAssetOptions.ForceSynchronousImport);
            var reloaded = AssetDatabase.LoadAssetAtPath<GameDataCatalogAsset>(root + "Area1GameDataCatalog.asset");
            if (reloaded == null) throw new InvalidOperationException("Reloaded Area 1 catalog is null.");
            if (reloaded.cards == null || reloaded.cards.Length != 6 || reloaded.unitRoles == null || reloaded.unitRoles.Length != 3 || reloaded.formations == null || reloaded.formations.Length != 1 || reloaded.stations == null || reloaded.stations.Length != 3) throw new InvalidOperationException("Reloaded Area 1 catalog has incorrect array sizes.");
            try { GameDataCatalogIndexBuilder.Build(reloaded); } catch (Exception ex) { throw new InvalidOperationException("Reloaded Area 1 catalog failed validation.", ex); }
            Debug.Log($"Reloaded Area 1 catalog: cards={reloaded.cards.Length}, unitRoles={reloaded.unitRoles.Length}, formations={reloaded.formations.Length}, stations={reloaded.stations.Length}");
        }
        static T Get<T>(string path) where T:ScriptableObject { var x=AssetDatabase.LoadAssetAtPath<T>(path); if(x==null){if(AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(path)!=null)throw new InvalidOperationException("Wrong asset type: "+path);x=ScriptableObject.CreateInstance<T>();AssetDatabase.CreateAsset(x,path);}return x; }
        static CardDefinitionAsset Card(string root,string file,string id,string core,CardKind kind,int recharge,int effect,string key){var x=Get<CardDefinitionAsset>(root+"Cards/"+file);x.stableId=id;x.coreCardId=core;x.kind=kind;x.rechargeTicks=recharge;x.effect=effect;x.effectKey=key;EditorUtility.SetDirty(x);return x;}
        static UnitRoleDefinitionAsset Role(string root,string file,string id,string role,int hp,int power,int min,int max,int move,int attack){var x=Get<UnitRoleDefinitionAsset>(root+"UnitRoles/"+file);x.stableId=id;x.coreRole=role;x.maxHp=hp;x.power=power;x.rangeMin=min;x.rangeMax=max;x.moveTicksPerCell=move;x.attackCooldownTicks=attack;EditorUtility.SetDirty(x);return x;}
        static StationDefinitionAsset Station(string root,string file,string id,string core,string[] neighbors){var x=Get<StationDefinitionAsset>(root+"Stations/"+file);x.stableId=id;x.coreStationId=core;x.neighbors=neighbors;EditorUtility.SetDirty(x);return x;}
        static void Ensure(string path){if(AssetDatabase.IsValidFolder(path))return;var slash=path.LastIndexOf('/');Ensure(path.Substring(0,slash));AssetDatabase.CreateFolder(path.Substring(0,slash),path.Substring(slash+1));}
        [MenuItem("Janseon/Data/Build Area 1 Catalog")] public static void MenuBuild(){Build();}
    }
}
