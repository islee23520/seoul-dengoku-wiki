CREATE DATABASE IF NOT EXISTS global_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS game_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS spec_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS common_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- global_db
-- ---------------------------------------------------------------------------
USE global_db;

CREATE TABLE IF NOT EXISTS tbl_auth_info (
  UID BIGINT NOT NULL AUTO_INCREMENT,
  venderID VARCHAR(128) NOT NULL,
  venderType TINYINT NOT NULL DEFAULT 0,
  marketID TINYINT NOT NULL DEFAULT 0,
  DID VARCHAR(128) NOT NULL DEFAULT '',
  Region VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
  GameDB SMALLINT NOT NULL DEFAULT 1,
  Nickname VARCHAR(64) NOT NULL DEFAULT '',
  LastNicknameChangeTime DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00',
  RegTime DATETIME NOT NULL,
  UnRegTime DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY (UID),
  UNIQUE KEY uk_vender (venderID)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_connection_info (
  Idx SMALLINT NOT NULL,
  Type VARCHAR(32) NOT NULL,
  ConnectionString TEXT NOT NULL,
  UsersCount INT NOT NULL DEFAULT 0,
  PRIMARY KEY (Idx)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tbl_connection_info (Idx, Type, ConnectionString, UsersCount) VALUES
(1, 'GAME_DB', 'Server=127.0.0.1;Port=13306;Database=game_db;user id=root;password=sk1234!;CharSet=utf8;Keepalive=10;SslMode=None;AllowPublicKeyRetrieval=True;Pooling=True;MinimumPoolSize=1;maximumpoolsize=10;', 0),
(2, 'CACHE', '{"Uri":"127.0.0.1:16379","BaseCacheInfo":[{"Type":0,"ExpireTime":24},{"Type":1,"ExpireTime":24},{"Type":2,"ExpireTime":24}]}', 0),
(3, 'SPEC_DB', 'Server=127.0.0.1;Port=13306;Database=spec_db;user id=root;password=sk1234!;CharSet=utf8;Keepalive=10;SslMode=None;AllowPublicKeyRetrieval=True;Pooling=True;MinimumPoolSize=1;maximumpoolsize=10;', 0);

DROP PROCEDURE IF EXISTS usp_get_auth_info;
DELIMITER $$
CREATE PROCEDURE usp_get_auth_info(
  IN inVenderID VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN inVenderType INT,
  IN inRegTime DATETIME
)
BEGIN
  DECLARE v_uid BIGINT;

  SELECT UID INTO v_uid
  FROM tbl_auth_info
  WHERE venderID = inVenderID
  LIMIT 1;

  IF v_uid IS NULL THEN
    INSERT INTO tbl_auth_info
      (venderID, venderType, marketID, DID, Region, GameDB, Nickname, LastNicknameChangeTime, RegTime, UnRegTime)
    VALUES
      (inVenderID, inVenderType, 0, '', 'LOCAL', 1, '', '1970-01-01 00:00:00', inRegTime, '1970-01-01 00:00:00');
    SET v_uid = LAST_INSERT_ID();
  END IF;

  SELECT * FROM tbl_auth_info WHERE UID = v_uid;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS usp_nicknameGenerator;
DELIMITER $$
CREATE PROCEDURE usp_nicknameGenerator(
  IN inUID BIGINT,
  IN inNickname VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  IN inUpdateTime DATETIME
)
BEGIN
  IF EXISTS (SELECT 1 FROM tbl_auth_info WHERE Nickname = inNickname AND UID <> inUID) THEN
    SELECT 202 AS result;
  ELSE
    UPDATE tbl_auth_info
    SET Nickname = inNickname, LastNicknameChangeTime = inUpdateTime
    WHERE UID = inUID;
    SELECT 0 AS result;
  END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS usp_generate_develop_vid;
DELIMITER $$
CREATE PROCEDURE usp_generate_develop_vid()
BEGIN
  SELECT CONCAT('dev-', REPLACE(UUID(), '-', '')) AS vid;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------------
-- game_db
-- ---------------------------------------------------------------------------
USE game_db;

CREATE TABLE IF NOT EXISTS tbl_account (
  AccountIdx BIGINT NOT NULL,
  Level SMALLINT NOT NULL DEFAULT 1,
  Exp INT NOT NULL DEFAULT 0,
  RepresentHeroIdx BIGINT NOT NULL DEFAULT 0,
  HeroInventoryMax SMALLINT NOT NULL DEFAULT 50,
  EquipmentInventoryMax SMALLINT NOT NULL DEFAULT 50,
  ItemInventoryMax SMALLINT NOT NULL DEFAULT 50,
  StraightDay INT NOT NULL DEFAULT 0,
  TotalLoginDay INT NOT NULL DEFAULT 0,
  TodayFirstLoginTime DATETIME NOT NULL,
  RegTime DATETIME NOT NULL,
  PRIMARY KEY (AccountIdx)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_energy (
  EnergyIdx BIGINT NOT NULL AUTO_INCREMENT,
  AccountIdx BIGINT NOT NULL,
  EnergyType TINYINT NOT NULL,
  Amount INT NOT NULL DEFAULT 0,
  ExtraAmount INT NOT NULL DEFAULT 0,
  NextChargeTime DATETIME NOT NULL,
  PRIMARY KEY (EnergyIdx),
  KEY ix_account (AccountIdx)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_gold (
  AccountIdx BIGINT NOT NULL,
  Amount BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (AccountIdx)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_cash (
  AccountIdx BIGINT NOT NULL,
  FreeCash BIGINT NOT NULL DEFAULT 0,
  PaidCash BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (AccountIdx)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_hero (
  HeroIdx BIGINT NOT NULL AUTO_INCREMENT,
  AccountIdx BIGINT NOT NULL,
  HeroID INT NOT NULL,
  Level SMALLINT NOT NULL DEFAULT 1,
  Exp INT NOT NULL DEFAULT 0,
  Reinforce TINYINT UNSIGNED NOT NULL DEFAULT 0,
  IsLock TINYINT(1) NOT NULL DEFAULT 0,
  IsStorage TINYINT(1) NOT NULL DEFAULT 0,
  RegTime DATETIME NOT NULL,
  PRIMARY KEY (HeroIdx),
  KEY ix_account (AccountIdx)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
-- spec_db (minimum rows so Config.InitSpecData can boot)
-- ---------------------------------------------------------------------------
USE spec_db;

CREATE TABLE IF NOT EXISTS tbl_default_value_spec (
  Type VARCHAR(64) NOT NULL,
  Data TEXT NOT NULL,
  PRIMARY KEY (Type)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_account_levelup_spec (
  Level INT NOT NULL,
  Exp INT NOT NULL,
  MaxEnergy SMALLINT NOT NULL,
  LevelupRewardGroupID INT NOT NULL DEFAULT 0,
  PRIMARY KEY (Level)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_hero_spec (
  HeroID INT NOT NULL,
  HeroGroupID INT NOT NULL,
  Name VARCHAR(64) NOT NULL,
  HeroGrade TINYINT NOT NULL,
  PRIMARY KEY (HeroID)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_reward_master (
  GroupID INT NOT NULL,
  RewardType TINYINT NOT NULL,
  Param1 INT NOT NULL DEFAULT 0,
  Param2 INT NOT NULL DEFAULT 0,
  Param3 INT NOT NULL DEFAULT 0,
  Param4 INT NOT NULL DEFAULT 0
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_newbie_spec (
  Region VARCHAR(32) NOT NULL,
  RewardType TINYINT NOT NULL,
  Param1 INT NOT NULL DEFAULT 0,
  Param2 INT NOT NULL DEFAULT 0,
  Param3 INT NOT NULL DEFAULT 0,
  Param4 INT NOT NULL DEFAULT 0
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tbl_reward_spec (
  GroupID INT NOT NULL,
  RewardType TINYINT NOT NULL,
  Param1 INT NOT NULL DEFAULT 0,
  Param2 INT NOT NULL DEFAULT 0,
  Param3 INT NOT NULL DEFAULT 0,
  Param4 INT NOT NULL DEFAULT 0
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tbl_default_value_spec (Type, Data) VALUES
('WorldResetTime', '00:00:00'),
('ENERGY', '[{"Type":1,"DefaultAmount":10,"ChargeAmount":1,"MaxChargeValue":100,"ChargeIntervalPerSec":60},{"Type":2,"DefaultAmount":5,"ChargeAmount":1,"MaxChargeValue":20,"ChargeIntervalPerSec":120}]'),
('INVENTOY', '[{"Type":1,"DefaultSlot":50,"MaxSlot":200},{"Type":2,"DefaultSlot":50,"MaxSlot":200},{"Type":3,"DefaultSlot":50,"MaxSlot":200}]');

INSERT INTO tbl_account_levelup_spec (Level, Exp, MaxEnergy, LevelupRewardGroupID) VALUES
(1, 100, 100, 0);

INSERT INTO tbl_hero_spec (HeroID, HeroGroupID, Name, HeroGrade) VALUES
(1, 1, 'Dummy', 1);

INSERT INTO tbl_reward_master (GroupID, RewardType, Param1, Param2, Param3, Param4) VALUES
(1, 1, 1, 0, 0, 0);

INSERT INTO tbl_newbie_spec (Region, RewardType, Param1, Param2, Param3, Param4) VALUES
('LOCAL', 2, 1, 0, 0, 0),
('DEV', 2, 1, 0, 0, 0);

-- ---------------------------------------------------------------------------
-- common_db (optional; ignored at boot)
-- ---------------------------------------------------------------------------
USE common_db;

CREATE TABLE IF NOT EXISTS tbl_Ignore_word_spec (
  Word VARCHAR(64) NOT NULL,
  IsLikeSearch TINYINT(1) NOT NULL DEFAULT 0
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
