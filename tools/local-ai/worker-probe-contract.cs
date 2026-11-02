using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;
using System.Xml;
using System.Xml.Linq;

// Strict, bounded private input; never contains a command, pipe, or request body.
internal sealed class ProbeContract {
    internal readonly string ServiceName, ServiceSid, OwnerSid, ImagePath, ImageSha256;
    internal readonly string BrokerPath, BrokerSha256, BrokerConfig, BrokerConfigSha256, ManifestSha256, Nonce, ReceiptPath;
    internal readonly int ApplicationPid, DeadlineMs;
    internal readonly long CreationFileTime;
    internal readonly DateTime ExpiresUtc;
    internal static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 65536, RecursionLimit = 8 };
    internal static void Require(bool value, string code) { if (!value) throw new InvalidDataException(code); }
    internal static Dictionary<string,object> Object(byte[] bytes) {
        Require(bytes.Length > 0 && bytes.Length <= 65536, "JSON_BOUNDS");
        using (var reader = JsonReaderWriterFactory.CreateJsonReader(bytes, XmlDictionaryReaderQuotas.Max)) {
            var root = XElement.Load(reader);
            Require((string)root.Attribute("type") == "object", "JSON_OBJECT");
            var seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (var field in root.Elements()) {
                Require(seen.Add(field.Name.LocalName) && !field.HasElements && field.Name.LocalName != "item", "JSON_DUPLICATE_OR_NESTED");
                Require((string)field.Attribute("type") != "null", "JSON_NULL");
            }
        }
        return Json.Deserialize<Dictionary<string,object>>(new UTF8Encoding(false,true).GetString(bytes));
    }
    internal static string Text(Dictionary<string,object> value, string key) {
        object item; Require(value.TryGetValue(key,out item) && item is string, "FIELD_STRING_" + key);
        return (string)item;
    }
    internal static string HashField(Dictionary<string,object> value, string key) {
        string result = Text(value,key); Require(Regex.IsMatch(result,@"\A[a-f0-9]{64}\z"),"HASH_"+key); return result;
    }
    internal static string Absolute(Dictionary<string,object> value, string key) {
        string result = Text(value,key);
        Require(Path.IsPathRooted(result) && result.Length > 3 && result[1] == ':' && Path.GetFullPath(result) == result && result.IndexOf('\0') < 0,"ABSOLUTE_"+key);
        return result;
    }
    internal ProbeContract(byte[] bytes) {
        var value = Object(bytes);
        string[] keys = { "schema", "serviceName", "serviceSid", "ownerSid", "applicationPid", "creationFileTime", "imagePath", "imageSha256", "brokerPath", "brokerSha256", "brokerConfig", "brokerConfigSha256", "manifestSha256", "nonce", "receiptPath", "deadlineMs", "expiresUtc" };
        Require(value.Count == keys.Length,"CONFIG_FIELDS"); foreach (string key in keys) Require(value.ContainsKey(key),"CONFIG_FIELD_"+key);
        Require(Text(value,"schema") == "worker-probe.v1","CONFIG_SCHEMA");
        ServiceName = Text(value,"serviceName"); ServiceSid = Text(value,"serviceSid"); OwnerSid = Text(value,"ownerSid");
        Require(Regex.IsMatch(ServiceName,@"\A[A-Za-z0-9_-]{1,128}\z") && NativeInstallation.ServiceSid(ServiceName) == ServiceSid,"SERVICE_SID");
        Require(new SecurityIdentifier(OwnerSid).Value == OwnerSid && OwnerSid.StartsWith("S-1-5-21-",StringComparison.Ordinal),"OWNER_SID");
        int pid, deadline; long created; DateTime expires;
        Require(Int32.TryParse(Text(value,"applicationPid"),NumberStyles.None,CultureInfo.InvariantCulture,out pid) && pid > 0,"APPLICATION_PID");
        Require(Int64.TryParse(Text(value,"creationFileTime"),NumberStyles.None,CultureInfo.InvariantCulture,out created) && created > 0,"CREATION_FILETIME");
        Require(Int32.TryParse(Text(value,"deadlineMs"),NumberStyles.None,CultureInfo.InvariantCulture,out deadline) && deadline > 0 && deadline <= 10000,"DEADLINE");
        Require(DateTime.TryParseExact(Text(value,"expiresUtc"),"o",CultureInfo.InvariantCulture,DateTimeStyles.RoundtripKind,out expires) && expires.Kind == DateTimeKind.Utc,"EXPIRY");
        ApplicationPid = pid; DeadlineMs = deadline; CreationFileTime = created; ExpiresUtc = expires;
        ImagePath = Absolute(value,"imagePath"); ImageSha256 = HashField(value,"imageSha256");
        BrokerPath = Absolute(value,"brokerPath"); BrokerSha256 = HashField(value,"brokerSha256");
        BrokerConfig = Absolute(value,"brokerConfig"); BrokerConfigSha256 = HashField(value,"brokerConfigSha256");
        ManifestSha256 = HashField(value,"manifestSha256"); ReceiptPath = Absolute(value,"receiptPath"); Nonce = Text(value,"nonce");
        Require(Regex.IsMatch(Nonce,@"\A[a-f0-9]{32}\z") && Path.GetFileName(ReceiptPath) == Nonce+".json","NONCE_RECEIPT");
        Require(Path.GetFileName(ImagePath).Equals("node.exe",StringComparison.OrdinalIgnoreCase),"APPLICATION_IMAGE");
    }
    internal static void PrivatePath(string path, string owner) {
        for (string cursor = path; cursor != null; cursor = Path.GetDirectoryName(cursor)) {
            Require((File.GetAttributes(cursor) & FileAttributes.ReparsePoint) == 0,"PRIVATE_REPARSE");
            if (Path.GetPathRoot(cursor) == cursor) break;
        }
        FileSystemSecurity acl = Directory.Exists(path) ? (FileSystemSecurity)Directory.GetAccessControl(path) : File.GetAccessControl(path);
        Require(acl.AreAccessRulesProtected && acl.GetOwner(typeof(SecurityIdentifier)).Value == owner,"PRIVATE_OWNER_DACL");
        foreach (FileSystemAccessRule rule in acl.GetAccessRules(true,true,typeof(SecurityIdentifier)))
            Require(rule.AccessControlType == AccessControlType.Allow && (rule.IdentityReference.Value == owner || rule.IdentityReference.Value == "S-1-5-18" || rule.IdentityReference.Value == "S-1-5-32-544"),"PRIVATE_ACE");
    }
}
