import test from "node:test";
import assert from "node:assert/strict";
import {
  createHash,
  createPrivateKey,
  sign as signBytes,
  constants,
} from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import {
  normalizeCertificateAssessment,
  normalizePkiObservation,
} from "../../internal/xades-provider/pki.mjs";
import {
  createXadesProvider,
  XADES_EDITION_ID,
  XADES_PROFILE_ID,
} from "../../internal/xades-provider/provider.mjs";
import {
  decodeResponse,
  encodeRequest,
} from "../../internal/xades-provider/worker.mjs";

const fixtureGenerator = String.raw`
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.zip.ZipFile;
import java.security.MessageDigest;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.lang.reflect.Method;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import org.bouncycastle.asn1.ASN1Integer;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.CRLReason;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.ExtendedKeyUsage;
import org.bouncycastle.asn1.x509.KeyPurposeId;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.X509v2CRLBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Element;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.bouncycastle.cert.jcajce.JcaX509v2CRLBuilder;
import org.bouncycastle.cert.ocsp.BasicOCSPResp;
import org.bouncycastle.cert.ocsp.CertificateID;
import org.bouncycastle.cert.ocsp.CertificateStatus;
import org.bouncycastle.cert.ocsp.BasicOCSPRespBuilder;
import org.bouncycastle.cert.ocsp.OCSPRespBuilder;
import org.bouncycastle.cert.ocsp.RespID;
import org.bouncycastle.cert.ocsp.UnknownStatus;
import org.bouncycastle.cert.ocsp.RevokedStatus;
import org.bouncycastle.cert.ocsp.OCSPResp;
import org.bouncycastle.cert.ocsp.jcajce.JcaBasicOCSPRespBuilder;
import org.bouncycastle.cert.ocsp.jcajce.JcaCertificateID;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.DigestCalculator;
import org.bouncycastle.operator.DigestCalculatorProvider;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.bouncycastle.operator.jcajce.JcaContentVerifierProviderBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateHolder;
import eu.europa.esig.dss.model.x509.CertificateToken;
import eu.europa.esig.dss.crl.CRLBinary;
import eu.europa.esig.dss.crl.CRLValidity;
import eu.europa.esig.dss.spi.x509.revocation.crl.CRLToken;
import eu.europa.esig.dss.spi.x509.revocation.ocsp.OCSPToken;

public final class PkiFixtureGenerator {
  static final long BASE = Instant.parse("2026-09-26T10:00:00Z").toEpochMilli();
  static String b64(byte[] b) { return Base64.getEncoder().encodeToString(b); }
  static Date date(long t) { return new Date(t); }
  static KeyPair keys() throws Exception { var g=KeyPairGenerator.getInstance("RSA"); g.initialize(2048); return g.generateKeyPair(); }
  static KeyPair ecKeys() throws Exception { var g=KeyPairGenerator.getInstance("EC"); g.initialize(256); return g.generateKeyPair(); }
  static KeyPair weakRsaKeys() throws Exception { var g=KeyPairGenerator.getInstance("RSA"); g.initialize(512); return g.generateKeyPair(); }
  static X509CertificateHolder certForPolicy(KeyPair k,boolean includeUsage,boolean digitalSignature) throws Exception {
    var name=new X500Name("CN=Verifactu P4 policy probe");
    var builder=new JcaX509v3CertificateBuilder(name,BigInteger.valueOf(45),date(BASE-86400000),date(BASE+86400000),name,k.getPublic());
    builder.addExtension(Extension.basicConstraints,true,new BasicConstraints(true));
    if(includeUsage)builder.addExtension(Extension.keyUsage,true,new KeyUsage(digitalSignature?KeyUsage.digitalSignature:KeyUsage.keyEncipherment));
    String algorithm=k.getPrivate().getAlgorithm().equals("RSA")?"SHA256withRSA":"SHA256withECDSA";
    return builder.build(new JcaContentSignerBuilder(algorithm).setProvider("BC").build(k.getPrivate()));
  }
  static X509CertificateHolder crossCertificate(KeyPair subjectKey,KeyPair issuerKey,String subject,String issuer,long serial) throws Exception {
    var builder=new JcaX509v3CertificateBuilder(new X500Name(issuer),BigInteger.valueOf(serial),date(BASE-86400000),date(BASE+86400000),new X500Name(subject),subjectKey.getPublic());
    builder.addExtension(Extension.basicConstraints,true,new BasicConstraints(true));
    builder.addExtension(Extension.keyUsage,true,new KeyUsage(KeyUsage.keyCertSign|KeyUsage.digitalSignature));
    return builder.build(new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(issuerKey.getPrivate()));
  }
  static X509CertificateHolder cert(KeyPair k) throws Exception {
    var name=new X500Name("CN=Verifactu P4 test root");
    var builder=new JcaX509v3CertificateBuilder(name,BigInteger.valueOf(42),date(BASE-365L*86400000),date(BASE+3650L*86400000),name,k.getPublic());
    builder.addExtension(Extension.basicConstraints,true,new BasicConstraints(true));
    builder.addExtension(Extension.keyUsage,true,new KeyUsage(KeyUsage.digitalSignature|KeyUsage.keyCertSign|KeyUsage.cRLSign));
    ContentSigner signer=new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(k.getPrivate());
    return builder.build(signer);
  }
  static X509CertificateHolder certWithEku(KeyPair k) throws Exception {
    var name=new X500Name("CN=Verifactu P4 EKU test certificate");
    var builder=new JcaX509v3CertificateBuilder(name,BigInteger.valueOf(44),date(BASE-365L*86400000),date(BASE+3650L*86400000),name,k.getPublic());
    builder.addExtension(Extension.basicConstraints,true,new BasicConstraints(true));
    builder.addExtension(Extension.keyUsage,true,new KeyUsage(KeyUsage.digitalSignature|KeyUsage.keyCertSign|KeyUsage.cRLSign));
    builder.addExtension(Extension.extendedKeyUsage,false,new ExtendedKeyUsage(KeyPurposeId.id_kp_serverAuth));
    return builder.build(new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(k.getPrivate()));
  }
  static X509CertificateHolder delegatedCert(KeyPair signerKey,X509CertificateHolder issuer,KeyPair responder,boolean digitalSignature,KeyPurposeId eku,long notBefore,long notAfter) throws Exception {
    return delegatedCert(signerKey,issuer,issuer.getSubject(),responder,digitalSignature,eku,notBefore,notAfter,true);
  }
  static X509CertificateHolder delegatedCert(KeyPair signerKey,X509CertificateHolder issuer,X500Name issuerName,KeyPair responder,boolean digitalSignature,KeyPurposeId eku,long notBefore,long notAfter,boolean includeKeyUsage) throws Exception {
    var subject=new X500Name("CN=Authorized OCSP responder");
    var builder=new JcaX509v3CertificateBuilder(issuerName,BigInteger.valueOf(43),date(notBefore),date(notAfter),subject,responder.getPublic());
    builder.addExtension(Extension.basicConstraints,true,new BasicConstraints(false));
    if(includeKeyUsage)builder.addExtension(Extension.keyUsage,true,new KeyUsage(digitalSignature?KeyUsage.digitalSignature:KeyUsage.keyEncipherment));
    if(eku!=null)builder.addExtension(Extension.extendedKeyUsage,false,new ExtendedKeyUsage(eku));
    return builder.build(new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(signerKey.getPrivate()));
  }
  static boolean authorized(Object evidence,X509Certificate issuer) throws Exception {
    Method method=Class.forName("eu.noeos.verifactu.bridge.DssBridge").getDeclaredMethod("authorizedRevocationToken",eu.europa.esig.dss.spi.x509.revocation.RevocationToken.class,X509Certificate.class,long.class);
    method.setAccessible(true);
    return (Boolean)method.invoke(null,evidence,issuer,BASE);
  }
  static Object dss(String name,Class<?>[] types,Object... args) throws Exception {
    Class<?> bridge=Class.forName("eu.noeos.verifactu.bridge.DssBridge");
    Method method=bridge.getDeclaredMethod(name,types); method.setAccessible(true);
    return method.invoke(null,args);
  }
  static void setRequest(Object request,String field,Object value) throws Exception {
    var member=request.getClass().getDeclaredField(field); member.setAccessible(true); member.set(request,value);
  }
  static String responseKind(Object response) throws Exception {
    var member=response.getClass().getDeclaredMethod("kind"); member.setAccessible(true); return (String)member.invoke(response);
  }
  static String recordString(Object record,String field) throws Exception {
    var member=record.getClass().getDeclaredMethod(field); member.setAccessible(true); return (String)member.invoke(record);
  }
  static Object request(X509CertificateHolder signer,List<byte[]> chain,List<byte[]> anchors,long validationTime) throws Exception {
    byte[] artifact="<RegistroAlta/>".getBytes(StandardCharsets.UTF_8);
    List<byte[]> fields=new ArrayList<>();
    for(String s:List.of("VERIFACTU-DSS-1","VERIFY","rrsif-2026-09-21-authoritative-candidate","AEAT-XADES-EPES-v0.1.5","RegistroAlta",java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(artifact)),Long.toString(BASE),Long.toString(validationTime),"86400",""))fields.add(s.getBytes(StandardCharsets.UTF_8));
    fields.add(artifact); fields.add(signer.getEncoded()); fields.add(Integer.toString(chain.size()).getBytes(StandardCharsets.UTF_8)); fields.addAll(chain); fields.add(new byte[0]);
    fields.add(Integer.toString(anchors.size()).getBytes(StandardCharsets.UTF_8)); fields.addAll(anchors); fields.add("0".getBytes(StandardCharsets.UTF_8)); fields.add("0".getBytes(StandardCharsets.UTF_8));
    return parsedRequest(encodeFields(fields));
  }
  static byte[] encodeFields(List<byte[]> fields) throws Exception {
    ByteArrayOutputStream encoded=new ByteArrayOutputStream(); for(byte[] field:fields){encoded.write(Base64.getEncoder().encode(field));encoded.write('\n');} return encoded.toByteArray();
  }
  static Object parsedRequest(byte[] input) throws Exception {
    Class<?> type=Class.forName("eu.noeos.verifactu.bridge.DssBridge$Request");
    var constructor=type.getDeclaredConstructor(java.io.InputStream.class); constructor.setAccessible(true);
    return constructor.newInstance(new ByteArrayInputStream(input));
  }
  static Object cursor(List<byte[]> values) throws Exception {
    Class<?> type=Class.forName("eu.noeos.verifactu.bridge.DssBridge$Cursor");
    var constructor=type.getDeclaredConstructor(List.class); constructor.setAccessible(true);
    return constructor.newInstance(values);
  }
  static Object cursorList(Object cursor) throws Exception {
    var method=cursor.getClass().getDeclaredMethod("list"); method.setAccessible(true); return method.invoke(cursor);
  }
  static boolean profileValid(byte[] xml) throws Exception {
    Method parse=Class.forName("eu.noeos.verifactu.bridge.DssBridge").getDeclaredMethod("parseXml",byte[].class); parse.setAccessible(true);
    Document document=(Document)parse.invoke(null,(Object)xml);
    return profileValid(document);
  }
  static boolean profileValid(Document document) throws Exception { return (Boolean)dss("validateProfile",new Class<?>[]{Document.class,String.class},document,"RegistroAlta"); }
  static Document copyDocument(byte[] xml) throws Exception {
    Method parse=Class.forName("eu.noeos.verifactu.bridge.DssBridge").getDeclaredMethod("parseXml",byte[].class); parse.setAccessible(true);
    return (Document)parse.invoke(null,(Object)xml);
  }
  static Element first(Document document,String namespace,String local) { NodeList nodes=document.getElementsByTagNameNS(namespace,local); return nodes.getLength()==0?null:(Element)nodes.item(0); }
  static void rejectProfile(Document document) throws Exception { if(profileValid(document)) throw new AssertionError("malformed XAdES profile accepted"); }
  static Element rsaKeyValue(Document document,byte[] modulus,byte[] exponent,boolean includeExponent) {
    String ns="http://www.w3.org/2000/09/xmldsig#";
    Element keyValue=document.createElementNS(ns,"ds:KeyValue"), rsa=document.createElementNS(ns,"ds:RSAKeyValue");
    Element modulusElement=document.createElementNS(ns,"ds:Modulus"); modulusElement.setTextContent(Base64.getEncoder().encodeToString(modulus)); rsa.appendChild(modulusElement);
    if(includeExponent){Element exponentElement=document.createElementNS(ns,"ds:Exponent"); exponentElement.setTextContent(Base64.getEncoder().encodeToString(exponent)); rsa.appendChild(exponentElement);}
    keyValue.appendChild(rsa); return keyValue;
  }
  static byte[] crl(KeyPair k,X509CertificateHolder cert,boolean revoked,long next) throws Exception {
    return crl(k,cert,new javax.security.auth.x500.X500Principal(cert.getSubject().getEncoded()),revoked,next);
  }
  static byte[] crl(KeyPair k,X509CertificateHolder cert,javax.security.auth.x500.X500Principal issuer,boolean revoked,long next) throws Exception {
    var b=new JcaX509v2CRLBuilder(issuer,date(BASE-3600000));
    b.setNextUpdate(date(next));
    if(revoked)b.addCRLEntry(BigInteger.valueOf(42),date(BASE-1800000),CRLReason.keyCompromise);
    return b.build(new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(k.getPrivate())).getEncoded();
  }
  static byte[] ocsp(KeyPair k,X509CertificateHolder cert,CertificateStatus status,long next) throws Exception {
    return ocspSignedBy(k,cert,cert,status,BASE-3600000,next);
  }
  static byte[] ocspSignedBy(KeyPair responder,X509CertificateHolder responderCert,X509CertificateHolder target,CertificateStatus status,long thisUpdate,long next) throws Exception {
    return ocspSignedBy(responder,responderCert,target,status,thisUpdate,next,false,true);
  }
  static byte[] ocspSignedBy(KeyPair responder,X509CertificateHolder responderCert,X509CertificateHolder target,CertificateStatus status,long thisUpdate,long next,boolean byName,boolean includeCertificate) throws Exception {
    return ocspSignedBy(responder,responderCert,target,status,thisUpdate,next,byName,includeCertificate,null);
  }
  static byte[] ocspSignedBy(KeyPair responder,X509CertificateHolder responderCert,X509CertificateHolder target,CertificateStatus status,long thisUpdate,long next,boolean byName,boolean includeCertificate,X500Name responderName) throws Exception {
    DigestCalculatorProvider calculators=new JcaDigestCalculatorProviderBuilder().setProvider("BC").build();
    DigestCalculator idDigest=calculators.get(CertificateID.HASH_SHA1);
    CertificateID id=new CertificateID(idDigest,target,BigInteger.valueOf(42));
    DigestCalculator keyDigest=calculators.get(CertificateID.HASH_SHA1);
    BasicOCSPRespBuilder b=responderName!=null?new BasicOCSPRespBuilder(new RespID(responderName)):byName?new BasicOCSPRespBuilder(new RespID(responderCert.getSubject())):new JcaBasicOCSPRespBuilder(responder.getPublic(),keyDigest);
    b.addResponse(id,status,date(thisUpdate),next==0?null:date(next),null);
    BasicOCSPResp basic=b.build(new JcaContentSignerBuilder("SHA256withRSA").setProvider("BC").build(responder.getPrivate()),includeCertificate?new X509CertificateHolder[]{responderCert}:new X509CertificateHolder[0],date(BASE));
    return new OCSPRespBuilder().build(OCSPRespBuilder.SUCCESSFUL,basic).getEncoded();
  }
  public static void main(String[] args) throws Exception {
    Security.addProvider(new BouncyCastleProvider());
    KeyPair k=keys(); X509CertificateHolder c=cert(k);
    KeyPair purposeKey=keys(); X509CertificateHolder purposeCertificate=certWithEku(purposeKey);
    KeyPair other=keys(); X509CertificateHolder otherCert=cert(other);
    X509Certificate runtimeCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(c);
    Object requestWithAnchor=request(c,List.of(),List.of(c.getEncoded()),BASE);
    Object requestWithoutAnchor=request(c,List.of(),List.of(),BASE);
    Object requestExpired=request(c,List.of(),List.of(c.getEncoded()),BASE+4_000L*86400000L);
    DocumentBuilderFactory helperFactory=DocumentBuilderFactory.newInstance(); helperFactory.setNamespaceAware(true);
    Document helperXml=helperFactory.newDocumentBuilder().parse(new ByteArrayInputStream("<r xmlns:ds='http://www.w3.org/2000/09/xmldsig#'><ds:Signature/></r>".getBytes(StandardCharsets.UTF_8)));
    Element helperRoot=helperXml.getDocumentElement();
    Element helperSignature=(Element)dss("directSignature",new Class<?>[]{Element.class},helperRoot);
    Document noSignatureXml=helperFactory.newDocumentBuilder().parse(new ByteArrayInputStream("<r/>".getBytes(StandardCharsets.UTF_8)));
    boolean directSignatureAbsent=dss("directSignature",new Class<?>[]{Element.class},noSignatureXml.getDocumentElement())==null;
    boolean childNull=dss("child",new Class<?>[]{Element.class,String.class,String.class},null,"urn:test","missing")==null;
    boolean childrenNull=((List<?>)dss("children",new Class<?>[]{Element.class,String.class,String.class},null,"urn:test","missing")).isEmpty();
    boolean keyValueOptional=(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},helperSignature,runtimeCertificate);
    var keyValue=helperXml.createElementNS("http://www.w3.org/2000/09/xmldsig#","ds:KeyValue"); helperSignature.appendChild(keyValue);
    boolean malformedKeyValueRejected= !(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},helperSignature,runtimeCertificate);
    helperSignature.appendChild(helperXml.createElementNS("http://www.w3.org/2000/09/xmldsig#","ds:KeyValue"));
    boolean duplicateKeyValuesRejected=!(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},helperSignature,runtimeCertificate);
    var rsaPublicKey=(java.security.interfaces.RSAPublicKey)runtimeCertificate.getPublicKey();
    byte[] rsaModulus=rsaPublicKey.getModulus().toByteArray(), rsaExponent=rsaPublicKey.getPublicExponent().toByteArray();
    Document rsaKeyXml=helperFactory.newDocumentBuilder().newDocument(); Element rsaKeySignature=rsaKeyXml.createElementNS("http://www.w3.org/2000/09/xmldsig#","ds:Signature"); rsaKeyXml.appendChild(rsaKeySignature);
    rsaKeySignature.appendChild(rsaKeyValue(rsaKeyXml,rsaModulus,rsaExponent,true));
    boolean validKeyValueAccepted=(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},rsaKeySignature,runtimeCertificate);
    rsaKeySignature.replaceChild(rsaKeyValue(rsaKeyXml,new byte[]{1},rsaExponent,true),rsaKeySignature.getFirstChild());
    boolean wrongModulusRejected=!(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},rsaKeySignature,runtimeCertificate);
    rsaKeySignature.replaceChild(rsaKeyValue(rsaKeyXml,rsaModulus,new byte[]{1},true),rsaKeySignature.getFirstChild());
    boolean wrongExponentRejected=!(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},rsaKeySignature,runtimeCertificate);
    rsaKeySignature.replaceChild(rsaKeyValue(rsaKeyXml,rsaModulus,rsaExponent,false),rsaKeySignature.getFirstChild());
    boolean incompleteRsaKeyValueRejected=!(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},rsaKeySignature,runtimeCertificate);
    if(!(validKeyValueAccepted&&wrongModulusRejected&&wrongExponentRejected&&incompleteRsaKeyValueRejected&&duplicateKeyValuesRejected)) throw new AssertionError("RSA KeyValue structure and value probes");
    Object noIssuer=dss("issuerFor",new Class<?>[]{X509Certificate.class,List.class,List.class,List.class},runtimeCertificate,List.of(),List.of(),List.of());
    Object uniqueIssuer=dss("issuerFor",new Class<?>[]{X509Certificate.class,List.class,List.class,List.class},runtimeCertificate,List.of(runtimeCertificate),List.of(),List.of());
    Object ambiguousIssuerProbe=dss("issuerFor",new Class<?>[]{X509Certificate.class,List.class,List.class,List.class},runtimeCertificate,List.of(runtimeCertificate,new JcaX509CertificateConverter().setProvider("BC").getCertificate(otherCert)),List.of(),List.of());
    X509Certificate unmatchedIssuerCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(purposeCertificate);
    Object unmatchedIssuerProbe=dss("issuerFor",new Class<?>[]{X509Certificate.class,List.class,List.class,List.class},runtimeCertificate,List.of(unmatchedIssuerCertificate),List.of(),List.of());
    if(unmatchedIssuerProbe!=null) throw new AssertionError("unmatched issuer probe");
    String chainProbe=(String)dss("validateChainLinks",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),requestWithAnchor);
    String trustProbe=(String)dss("validatePath",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),requestWithAnchor);
    String noAnchorTrust=(String)dss("validatePath",new Class<?>[]{X509Certificate.class,List.class,requestWithoutAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),requestWithoutAnchor);
    String timeProbe=(String)dss("validateTime",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),requestWithAnchor);
    String expiredTime=(String)dss("validateTime",new Class<?>[]{X509Certificate.class,List.class,requestExpired.getClass()},runtimeCertificate,List.of(runtimeCertificate),requestExpired);
    boolean chainDuplicateRejected="INVALID".equals(dss("validateChainLinks",new Class<?>[]{X509Certificate.class,List.class,requestWithoutAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),request(c,List.of(otherCert.getEncoded(),otherCert.getEncoded()),List.of(),BASE)));
    boolean chainAmbiguityRejected="INVALID".equals(dss("validateChainLinks",new Class<?>[]{X509Certificate.class,List.class,requestWithoutAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),request(c,List.of(otherCert.getEncoded(),cert(keys()).getEncoded()),List.of(),BASE)));
    KeyPair cycleAKey=keys(),cycleBKey=keys();
    X509Certificate cycleA=new JcaX509CertificateConverter().setProvider("BC").getCertificate(crossCertificate(cycleAKey,cycleBKey,"CN=Cycle","CN=Cycle",51));
    X509Certificate cycleB=new JcaX509CertificateConverter().setProvider("BC").getCertificate(crossCertificate(cycleBKey,cycleAKey,"CN=Cycle","CN=Cycle",52));
    boolean chainCycleRejected="INVALID".equals(dss("validateChainLinks",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},cycleA,List.of(cycleA,cycleB),requestWithoutAnchor));
    if(!chainCycleRejected) throw new AssertionError("certificate path cycle probe");
    boolean nonemptyParameterChain=dss("parameters",new Class<?>[]{requestWithAnchor.getClass()},request(c,List.of(c.getEncoded()),List.of(),BASE))!=null;
    Object badProtocolRequest=request(c,List.of(),List.of(),BASE); setRequest(badProtocolRequest,"protocol","WRONG");
    boolean badProtocolRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{badProtocolRequest.getClass()},badProtocolRequest)));
    Object badDigestRequest=request(c,List.of(),List.of(),BASE); setRequest(badDigestRequest,"digest","00");
    boolean badDigestRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{badDigestRequest.getClass()},badDigestRequest)));
    Object emptyArtifactRequest=request(c,List.of(),List.of(),BASE); setRequest(emptyArtifactRequest,"artifact",new byte[0]);
    boolean emptyArtifactRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{emptyArtifactRequest.getClass()},emptyArtifactRequest)));
    Object oversizedChainRequest=request(c,List.of(),List.of(),BASE); setRequest(oversizedChainRequest,"chain",new ArrayList<>(java.util.Collections.nCopies(17,c.getEncoded())));
    boolean oversizedChainLimited="LIMIT".equals(responseKind(dss("dispatch",new Class<?>[]{oversizedChainRequest.getClass()},oversizedChainRequest)));
    Object unknownCommandRequest=request(c,List.of(),List.of(),BASE); setRequest(unknownCommandRequest,"command","UNKNOWN");
    boolean unknownCommandRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{unknownCommandRequest.getClass()},unknownCommandRequest)));
    Object missingPrepareCertificate=request(c,List.of(),List.of(),BASE); setRequest(missingPrepareCertificate,"command","SIGN_PREPARE"); setRequest(missingPrepareCertificate,"signerCertificate",new byte[0]);
    boolean missingPrepareCertificateRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{missingPrepareCertificate.getClass()},missingPrepareCertificate)));
    Object emptySignerComplete=request(c,List.of(),List.of(),BASE); setRequest(emptySignerComplete,"command","SIGN_COMPLETE"); setRequest(emptySignerComplete,"signerCertificate",new byte[0]);
    boolean emptySignerCompleteRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{emptySignerComplete.getClass()},emptySignerComplete)));
    Object badCompleteSignature=request(c,List.of(),List.of(),BASE); setRequest(badCompleteSignature,"command","SIGN_COMPLETE"); setRequest(badCompleteSignature,"signature",new byte[1]);
    boolean badCompleteSignatureRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{badCompleteSignature.getClass()},badCompleteSignature)));
    Object oversizedCompleteSignature=request(c,List.of(),List.of(),BASE); setRequest(oversizedCompleteSignature,"command","SIGN_COMPLETE"); setRequest(oversizedCompleteSignature,"signature",new byte[1025]);
    boolean oversizedCompleteSignatureRejected="INVALID".equals(responseKind(dss("dispatch",new Class<?>[]{oversizedCompleteSignature.getClass()},oversizedCompleteSignature)));
    if(!(badProtocolRejected&&badDigestRejected&&emptyArtifactRejected&&oversizedChainLimited&&unknownCommandRejected&&missingPrepareCertificateRejected&&emptySignerCompleteRejected&&badCompleteSignatureRejected&&oversizedCompleteSignatureRejected)) throw new AssertionError("dispatch rejection probes");
    boolean negativeCursorCountRejected=false; try{cursorList(cursor(List.of("-1".getBytes(StandardCharsets.UTF_8))));}catch(java.lang.reflect.InvocationTargetException expected){negativeCursorCountRejected=true;}
    boolean oversizedCursorCountRejected=false; try{cursorList(cursor(List.of("33".getBytes(StandardCharsets.UTF_8))));}catch(java.lang.reflect.InvocationTargetException expected){oversizedCursorCountRejected=true;}
    List<byte[]> validFields=new ArrayList<>(); byte[] validArtifact="<RegistroAlta/>".getBytes(StandardCharsets.UTF_8);
    for(String value:List.of("VERIFACTU-DSS-1","VERIFY","rrsif-2026-09-21-authoritative-candidate","AEAT-XADES-EPES-v0.1.5","RegistroAlta",java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(validArtifact)),Long.toString(BASE),Long.toString(BASE),"86400",""))validFields.add(value.getBytes(StandardCharsets.UTF_8));
    validFields.add(validArtifact); validFields.add(c.getEncoded()); validFields.add("0".getBytes(StandardCharsets.UTF_8)); validFields.add(new byte[0]); validFields.add("0".getBytes(StandardCharsets.UTF_8)); validFields.add("0".getBytes(StandardCharsets.UTF_8)); validFields.add("0".getBytes(StandardCharsets.UTF_8));
    List<byte[]> tooManyFields=new ArrayList<>(java.util.Collections.nCopies(129,new byte[0]));
    boolean requestFieldLimitRejected=false; try{parsedRequest(encodeFields(tooManyFields));}catch(java.lang.reflect.InvocationTargetException expected){requestFieldLimitRejected=true;}
    List<byte[]> trailingFields=new ArrayList<>(validFields); trailingFields.add("unexpected".getBytes(StandardCharsets.UTF_8));
    boolean trailingRequestFieldRejected=false; try{parsedRequest(encodeFields(trailingFields));}catch(java.lang.reflect.InvocationTargetException expected){trailingRequestFieldRejected=true;}
    if(!(negativeCursorCountRejected&&oversizedCursorCountRejected&&requestFieldLimitRejected&&trailingRequestFieldRejected)) throw new AssertionError("request parser probes");
    X509Certificate noUsageCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(certForPolicy(keys(),false,true));
    X509Certificate wrongUsageCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(certForPolicy(keys(),true,false));
    X509Certificate nonRsaCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(certForPolicy(ecKeys(),true,true));
    X509CertificateHolder weakRsaHolder=certForPolicy(weakRsaKeys(),true,true);
    String noUsageAssessment=dss("assessCertificate",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},noUsageCertificate,List.of(noUsageCertificate),requestWithAnchor).toString();
    String wrongUsageAssessment=dss("assessCertificate",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},wrongUsageCertificate,List.of(wrongUsageCertificate),requestWithAnchor).toString();
    String nonRsaAssessment=dss("assessCertificate",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},nonRsaCertificate,List.of(nonRsaCertificate),requestWithAnchor).toString();
    X509Certificate weakRsaCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(weakRsaHolder);
    String weakRsaAssessment=dss("assessCertificate",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},weakRsaCertificate,List.of(weakRsaCertificate),requestWithAnchor).toString();
    if(!noUsageAssessment.contains("usage=INVALID")||!wrongUsageAssessment.contains("usage=INVALID")||!nonRsaAssessment.contains("algorithm=INVALID")||!weakRsaAssessment.contains("algorithm=INVALID")) throw new AssertionError("certificate use and algorithm probes");
    boolean noUsageSigningRejected=false; try{dss("parameters",new Class<?>[]{requestWithAnchor.getClass()},request(certForPolicy(keys(),false,true),List.of(),List.of(),BASE));}catch(java.lang.reflect.InvocationTargetException expected){noUsageSigningRejected=true;}
    boolean wrongUsageSigningRejected=false; try{dss("parameters",new Class<?>[]{requestWithAnchor.getClass()},request(certForPolicy(keys(),true,false),List.of(),List.of(),BASE));}catch(java.lang.reflect.InvocationTargetException expected){wrongUsageSigningRejected=true;}
    boolean nonRsaSigningRejected=false; try{dss("parameters",new Class<?>[]{requestWithAnchor.getClass()},request(certForPolicy(ecKeys(),true,true),List.of(),List.of(),BASE));}catch(java.lang.reflect.InvocationTargetException expected){nonRsaSigningRejected=true;}
    boolean weakRsaSigningRejected=false; try{dss("parameters",new Class<?>[]{requestWithAnchor.getClass()},request(weakRsaHolder,List.of(),List.of(),BASE));}catch(java.lang.reflect.InvocationTargetException expected){weakRsaSigningRejected=true;}
    if(!(noUsageSigningRejected&&wrongUsageSigningRejected&&nonRsaSigningRejected&&weakRsaSigningRejected)) throw new AssertionError("signing certificate parameter policy probes");
    var ecKeyValue=helperXml.createElementNS("http://www.w3.org/2000/09/xmldsig#","ds:KeyValue");
    var ecSignature=helperXml.createElementNS("http://www.w3.org/2000/09/xmldsig#","ds:Signature"); ecSignature.appendChild(ecKeyValue);
    boolean nonRsaKeyValueRejected=!(Boolean)dss("keyValueMatches",new Class<?>[]{Element.class,X509Certificate.class},ecSignature,nonRsaCertificate);
    if(!nonRsaKeyValueRejected) throw new AssertionError("non-RSA KeyValue probe");
    byte[] officialXml;
    try(ZipFile archive=new ZipFile("editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip")) {
      officialXml=archive.getInputStream(archive.getEntry("ejemploRegistro-firmado-epes-xades4j.xml")).readAllBytes();
    }
    String officialText=new String(officialXml,StandardCharsets.UTF_8);
    String[] profileAlternatives={
      officialText.replace("RegistroAlta", "RegistroAnulacion"),
      officialText.replace("REC-xml-c14n-20010315", "unsupported-c14n"),
      officialText.replace("rsa-sha256", "unsupported-signature"),
      officialText.replace("URI=\"\"", "URI=\"#unexpected\""),
      officialText.replace("#SignedProperties", "#UnexpectedProperties"),
      officialText.replace("urn:oid:2.16.724.1.3.1.1.2.1.9", "urn:oid:1.2.3"),
      officialText.replace("politica_de_firma_anexo_1.pdf", "other-policy.pdf"),
      officialText.replace("<ds:KeyInfo>", "<ds:KeyInfo><ds:KeyValue/>"),
      officialText.replace("Target=\"#xmldsig-", "Target=\"#wrong-")
    };
    if(!profileValid(officialXml)) throw new AssertionError("official profile positive probe");
    int rejectedProfiles=0;
    for(String alternative:profileAlternatives) if(!alternative.equals(officialText)) {
      if(profileValid(alternative.getBytes(StandardCharsets.UTF_8))) throw new AssertionError("profile mutation accepted");
      rejectedProfiles++;
    }
    if(rejectedProfiles<5) throw new AssertionError("profile mutation probes missing");
    String dsNs="http://www.w3.org/2000/09/xmldsig#", xadesNs="http://uri.etsi.org/01903/v1.3.2#";
    Document noSignature=copyDocument(officialXml); Element noSignatureElement=first(noSignature,dsNs,"Signature"); noSignatureElement.getParentNode().removeChild(noSignatureElement); rejectProfile(noSignature);
    Document nestedSignature=copyDocument(officialXml); Element nestedSig=first(nestedSignature,dsNs,"Signature"); Element nestedWrap=nestedSignature.createElement("wrapper"); nestedSig.getParentNode().replaceChild(nestedWrap,nestedSig); nestedWrap.appendChild(nestedSig); rejectProfile(nestedSignature);
    Document duplicateSignature=copyDocument(officialXml); Element duplicateSig=first(duplicateSignature,dsNs,"Signature"); duplicateSig.getParentNode().appendChild(duplicateSig.cloneNode(true)); rejectProfile(duplicateSignature);
    Document shortSignature=copyDocument(officialXml); Element shortSig=first(shortSignature,dsNs,"Signature"); shortSig.removeChild(first(shortSignature,dsNs,"SignedInfo")); rejectProfile(shortSignature);
    Document reorderedSignature=copyDocument(officialXml); Element reorderedSig=first(reorderedSignature,dsNs,"Signature"); Element signedInfoElement=first(reorderedSignature,dsNs,"SignedInfo"); Element signatureValueElement=first(reorderedSignature,dsNs,"SignatureValue"); reorderedSig.insertBefore(signatureValueElement,signedInfoElement); rejectProfile(reorderedSignature);
    Document emptyKeyInfo=copyDocument(officialXml); Element keyInfo=first(emptyKeyInfo,dsNs,"KeyInfo"); while(keyInfo.hasChildNodes())keyInfo.removeChild(keyInfo.getFirstChild()); rejectProfile(emptyKeyInfo);
    Document oversizedKeyInfo=copyDocument(officialXml); Element manyKeyInfo=first(oversizedKeyInfo,dsNs,"KeyInfo"); manyKeyInfo.appendChild(oversizedKeyInfo.createElementNS(dsNs,"ds:KeyValue")); manyKeyInfo.appendChild(oversizedKeyInfo.createElementNS(dsNs,"ds:KeyValue")); rejectProfile(oversizedKeyInfo);
    Document missingPolicyId=copyDocument(officialXml); Element policyId=first(missingPolicyId,xadesNs,"Identifier"); policyId.getParentNode().removeChild(policyId); rejectProfile(missingPolicyId);
    Document invalidQualifyingTarget=copyDocument(officialXml); first(invalidQualifyingTarget,xadesNs,"QualifyingProperties").setAttribute("Target","bad-target"); rejectProfile(invalidQualifyingTarget);
    Document misplacedQualifying=copyDocument(officialXml); Element misplaced=first(misplacedQualifying,xadesNs,"QualifyingProperties"); misplaced.getParentNode().removeChild(misplaced); misplacedQualifying.getDocumentElement().appendChild(misplaced); rejectProfile(misplacedQualifying);
    Document unsignedProperties=copyDocument(officialXml); Element qualifying=first(unsignedProperties,xadesNs,"QualifyingProperties"); qualifying.appendChild(unsignedProperties.createElementNS(xadesNs,"xades:UnsignedProperties")); rejectProfile(unsignedProperties);
    Document extraSignedInfoChild=copyDocument(officialXml); first(extraSignedInfoChild,dsNs,"SignedInfo").appendChild(extraSignedInfoChild.createElementNS(dsNs,"ds:Extra")); rejectProfile(extraSignedInfoChild);
    Document wrongSignedInfoSecondChild=copyDocument(officialXml); Element signedInfoForOrder=first(wrongSignedInfoSecondChild,dsNs,"SignedInfo"); Element signatureMethodForOrder=first(wrongSignedInfoSecondChild,dsNs,"SignatureMethod"); Element firstReferenceForOrder=first(wrongSignedInfoSecondChild,dsNs,"Reference"); signedInfoForOrder.insertBefore(firstReferenceForOrder,signatureMethodForOrder); rejectProfile(wrongSignedInfoSecondChild);
    Document wrongKeyValueNamespace=copyDocument(officialXml); first(wrongKeyValueNamespace,dsNs,"KeyInfo").appendChild(wrongKeyValueNamespace.createElementNS("urn:wrong","x:KeyValue")); rejectProfile(wrongKeyValueNamespace);
    Document rootUnsignedProperties=copyDocument(officialXml); rootUnsignedProperties.getDocumentElement().appendChild(rootUnsignedProperties.createElementNS(xadesNs,"xades:UnsignedProperties")); rejectProfile(rootUnsignedProperties);
    Document missingCertificateDigests=copyDocument(officialXml); Element signingCertificate=first(missingCertificateDigests,xadesNs,"SigningCertificate"); NodeList certDigestMethods=signingCertificate.getElementsByTagNameNS(dsNs,"DigestMethod"); while(certDigestMethods.getLength()>0)certDigestMethods.item(0).getParentNode().removeChild(certDigestMethods.item(0)); NodeList certDigestValues=signingCertificate.getElementsByTagNameNS(dsNs,"DigestValue"); while(certDigestValues.getLength()>0)certDigestValues.item(0).getParentNode().removeChild(certDigestValues.item(0)); rejectProfile(missingCertificateDigests);
    Document missingQualifyingChild=copyDocument(officialXml); Element qualifyingChild=first(missingQualifyingChild,xadesNs,"QualifyingProperties"); qualifyingChild.removeChild(first(missingQualifyingChild,xadesNs,"SignedProperties")); rejectProfile(missingQualifyingChild);
    Document wrongQualifyingChild=copyDocument(officialXml); Element wrongQualifying=first(wrongQualifyingChild,xadesNs,"QualifyingProperties"); Element properties=first(wrongQualifyingChild,xadesNs,"SignedProperties"); properties.getParentNode().removeChild(properties); wrongQualifying.getParentNode().appendChild(properties); wrongQualifying.appendChild(wrongQualifyingChild.createElementNS(xadesNs,"xades:Other")); rejectProfile(wrongQualifyingChild);
    Document extraObjectChild=copyDocument(officialXml); first(extraObjectChild,dsNs,"Object").appendChild(extraObjectChild.createElementNS(dsNs,"ds:Extra")); rejectProfile(extraObjectChild);
    Document duplicateObject=copyDocument(officialXml); first(duplicateObject,dsNs,"Signature").appendChild(duplicateObject.createElementNS(dsNs,"ds:Object")); rejectProfile(duplicateObject);
    Document wrongKeyInfoChild=copyDocument(officialXml); first(wrongKeyInfoChild,dsNs,"KeyInfo").appendChild(wrongKeyInfoChild.createElementNS(dsNs,"ds:Other")); rejectProfile(wrongKeyInfoChild);
    Document wrongSigningCertDigestAlgorithm=copyDocument(officialXml); Element signingCertForAlgorithm=first(wrongSigningCertDigestAlgorithm,xadesNs,"SigningCertificate"); ((Element)signingCertForAlgorithm.getElementsByTagNameNS(dsNs,"DigestMethod").item(0)).setAttribute("Algorithm","urn:unsupported"); rejectProfile(wrongSigningCertDigestAlgorithm);
    boolean zeroLengthXmlRejected=false; try{dss("parseXml",new Class<?>[]{byte[].class},new byte[0]);}catch(java.lang.reflect.InvocationTargetException expected){zeroLengthXmlRejected=true;}
    boolean overLimitXmlRejected=false; try{dss("parseXml",new Class<?>[]{byte[].class},new byte[8_388_609]);}catch(java.lang.reflect.InvocationTargetException expected){overLimitXmlRejected=true;}
    StringBuilder deepXml=new StringBuilder(); for(int i=0;i<66;i++)deepXml.append("<a>"); for(int i=0;i<66;i++)deepXml.append("</a>");
    boolean deepXmlRejected=false; try{dss("parseXml",new Class<?>[]{byte[].class},deepXml.toString().getBytes(StandardCharsets.UTF_8));}catch(java.lang.reflect.InvocationTargetException expected){deepXmlRejected=true;}
    StringBuilder attributesXml=new StringBuilder("<a"); for(int i=0;i<4097;i++)attributesXml.append(" x").append(i).append("='v'"); attributesXml.append("/>");
    boolean attributesXmlRejected=false; try{dss("parseXml",new Class<?>[]{byte[].class},attributesXml.toString().getBytes(StandardCharsets.UTF_8));}catch(java.lang.reflect.InvocationTargetException expected){attributesXmlRejected=true;}
    String textXml="<a>"+"x".repeat(2_097_153)+"</a>";
    boolean textXmlRejected=false; try{dss("parseXml",new Class<?>[]{byte[].class},textXml.getBytes(StandardCharsets.UTF_8));}catch(java.lang.reflect.InvocationTargetException expected){textXmlRejected=true;}
    String nodeXml="<a>"+"<b/>".repeat(100_001)+"</a>";
    boolean nodeCountXmlRejected=false; try{dss("parseXml",new Class<?>[]{byte[].class},nodeXml.getBytes(StandardCharsets.UTF_8));}catch(java.lang.reflect.InvocationTargetException expected){nodeCountXmlRejected=true;}
    boolean oversizedRequestLineRejected=false; try{parsedRequest("A".repeat(32_000_001).getBytes(StandardCharsets.US_ASCII));}catch(java.lang.reflect.InvocationTargetException expected){oversizedRequestLineRejected=true;}
    if(!(nodeCountXmlRejected&&oversizedRequestLineRejected)) throw new AssertionError("XML and request byte bound probes");
    Object assessmentProbe=dss("assessCertificate",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},runtimeCertificate,List.of(runtimeCertificate),requestWithAnchor);
    X509Certificate purposeRuntime=new JcaX509CertificateConverter().setProvider("BC").getCertificate(purposeCertificate);
    Object purposeAssessment=dss("assessCertificate",new Class<?>[]{X509Certificate.class,List.class,requestWithAnchor.getClass()},purposeRuntime,List.of(purposeRuntime),requestWithAnchor);
    Object parametersProbe=dss("parameters",new Class<?>[]{requestWithAnchor.getClass()},requestWithAnchor);
    KeyPair delegatedKey=keys(); X509CertificateHolder delegated=delegatedCert(k,c,delegatedKey,true,KeyPurposeId.id_kp_OCSPSigning,BASE-86400000,BASE+86400000);
    KeyPair noEkuKey=keys(); X509CertificateHolder noEku=delegatedCert(k,c,noEkuKey,true,null,BASE-86400000,BASE+86400000);
    KeyPair wrongEkuKey=keys(); X509CertificateHolder wrongEku=delegatedCert(k,c,wrongEkuKey,true,KeyPurposeId.id_kp_serverAuth,BASE-86400000,BASE+86400000);
    KeyPair noDigitalKey=keys(); X509CertificateHolder noDigital=delegatedCert(k,c,noDigitalKey,false,KeyPurposeId.id_kp_OCSPSigning,BASE-86400000,BASE+86400000);
    KeyPair noKeyUsageKey=keys(); X509CertificateHolder noKeyUsage=delegatedCert(k,c,c.getSubject(),noKeyUsageKey,true,KeyPurposeId.id_kp_OCSPSigning,BASE-86400000,BASE+86400000,false);
    KeyPair futureKey=keys(); X509CertificateHolder future=delegatedCert(k,c,futureKey,true,KeyPurposeId.id_kp_OCSPSigning,BASE+86400000,BASE+2L*86400000);
    KeyPair wrongIssuerKey=keys(); X509CertificateHolder wrongIssuer=delegatedCert(other,c,wrongIssuerKey,true,KeyPurposeId.id_kp_OCSPSigning,BASE-86400000,BASE+86400000);
    KeyPair wrongIssuerNameKey=keys(); X509CertificateHolder wrongIssuerName=delegatedCert(k,c,new X500Name("CN=Different issuer"),wrongIssuerNameKey,true,KeyPurposeId.id_kp_OCSPSigning,BASE-86400000,BASE+86400000,true);
    var issuerCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(c);
    byte[] mismatchedCrl=crl(k,c,new javax.security.auth.x500.X500Principal("CN=Different issuer"),false,BASE+86400000);
    CRLValidity mismatchedValidity=new CRLValidity(new CRLBinary(mismatchedCrl));
    mismatchedValidity.setIssuerToken(new CertificateToken(issuerCertificate));
    mismatchedValidity.setThisUpdate(date(BASE-3600000)); mismatchedValidity.setNextUpdate(date(BASE+86400000));
    boolean crlAuthorityRejects= !authorized(new CRLToken(new CertificateToken(issuerCertificate),mismatchedValidity),issuerCertificate);
    byte[] badSignature=ocspSignedBy(other,delegated,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000,true,true);
    OCSPResp badResponse=new OCSPResp(badSignature);
    BasicOCSPResp badBasic=(BasicOCSPResp)badResponse.getResponseObject();
    var leafCertificate=new JcaX509CertificateConverter().setProvider("BC").getCertificate(c);
    boolean ocspSignatureRejects= !authorized(new OCSPToken(badBasic,badBasic.getResponses()[0],new CertificateToken(leafCertificate),new CertificateToken(issuerCertificate)),issuerCertificate);
    boolean unsupportedTokenRejects= !authorized(null,issuerCertificate);
    final int fuzzCount=4096, pkiFuzzSeed=0x50444607, protocolFuzzSeed=0x50444608;
    Random pkiFuzzer=new Random(pkiFuzzSeed); MessageDigest pkiCorpus=MessageDigest.getInstance("SHA-256");
    Object fuzzRequest=request(c,List.of(),List.of(),BASE);
    for(int i=0;i<fuzzCount;i++) {
      byte[] raw=new byte[pkiFuzzer.nextInt(513)]; pkiFuzzer.nextBytes(raw); pkiCorpus.update((byte)(raw.length&0xff)); pkiCorpus.update(raw);
      setRequest(fuzzRequest,"crls",i%2==0?List.of(raw):List.of()); setRequest(fuzzRequest,"ocsps",i%2==0?List.of():List.of(raw));
      String outcome=recordString(dss("validateRevocation",new Class<?>[]{X509Certificate.class,List.class,fuzzRequest.getClass()},issuerCertificate,List.of(issuerCertificate),fuzzRequest),"status");
      if("VALID".equals(outcome)||"REVOKED".equals(outcome)) throw new AssertionError("P4-FUZZ-007 seed="+pkiFuzzSeed+" case="+i+" outcome="+outcome);
    }
    Random protocolFuzzer=new Random(protocolFuzzSeed); MessageDigest protocolCorpus=MessageDigest.getInstance("SHA-256");
    for(int i=0;i<fuzzCount;i++) {
      byte[] raw=new byte[protocolFuzzer.nextInt(513)]; protocolFuzzer.nextBytes(raw); protocolCorpus.update((byte)(raw.length&0xff)); protocolCorpus.update(raw);
      try{parsedRequest(raw);}catch(java.lang.reflect.InvocationTargetException rejected){/* malformed protocol input is fail-closed */}
    }
    String json="{\"certificate\":\""+b64(c.getEncoded())+"\",\"otherCertificate\":\""+b64(otherCert.getEncoded())+"\",\"privateKey\":\""+b64(k.getPrivate().getEncoded())+"\",\"purposeCertificate\":\""+b64(purposeCertificate.getEncoded())+"\",\"purposePrivateKey\":\""+b64(purposeKey.getPrivate().getEncoded())+"\",\"crlGood\":\""+b64(crl(k,c,false,BASE+86400000))+"\",\"crlRevoked\":\""+b64(crl(k,c,true,BASE+86400000))+"\",\"crlStale\":\""+b64(crl(k,c,false,BASE-1))+"\",\"crlWrongIssuer\":\""+b64(crl(other,otherCert,false,BASE+86400000))+"\",\"ocspGood\":\""+b64(ocsp(k,c,CertificateStatus.GOOD,BASE+3600000))+"\",\"ocspStale\":\""+b64(ocsp(k,c,CertificateStatus.GOOD,BASE+3600000))+"\",\"ocspDelegated\":\""+b64(ocspSignedBy(delegatedKey,delegated,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspFuture\":\""+b64(ocspSignedBy(k,c,c,CertificateStatus.GOOD,BASE+1000,BASE+3600000))+"\",\"ocspNoNextUpdate\":\""+b64(ocspSignedBy(k,c,c,CertificateStatus.GOOD,BASE-1000,0))+"\",\"ocspWrongResponder\":\""+b64(ocspSignedBy(other,otherCert,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspWrongResponderRevoked\":\""+b64(ocspSignedBy(other,otherCert,c,new RevokedStatus(date(BASE-1800000),CRLReason.keyCompromise),BASE-1000,BASE+3600000))+"\",\"ocspUnknown\":\""+b64(ocsp(k,c,new UnknownStatus(),BASE+3600000))+"\",\"ocspRevoked\":\""+b64(ocsp(k,c,new RevokedStatus(date(BASE-1800000),CRLReason.keyCompromise),BASE+3600000))+"\"}";
    String extra=",\"probeDirectSignatureAbsent\":"+directSignatureAbsent+",\"probeChildNull\":"+childNull+",\"probeChildrenNull\":"+childrenNull+",\"probeOptionalKeyValue\":"+keyValueOptional+",\"probeMalformedKeyValueRejected\":"+malformedKeyValueRejected+",\"probeNoIssuer\":"+(noIssuer==null)+",\"probeUniqueIssuer\":"+(uniqueIssuer!=null)+",\"probeAmbiguousIssuer\":"+(ambiguousIssuerProbe==null)+",\"probeChain\":\""+chainProbe+"\",\"probeChainDuplicateRejected\":"+chainDuplicateRejected+",\"probeChainAmbiguityRejected\":"+chainAmbiguityRejected+",\"probeTrust\":\""+trustProbe+"\",\"probeNoAnchorTrust\":\""+noAnchorTrust+"\",\"probeTime\":\""+timeProbe+"\",\"probeExpiredTime\":\""+expiredTime+"\",\"probeZeroLengthXmlRejected\":"+zeroLengthXmlRejected+",\"probeOverLimitXmlRejected\":"+overLimitXmlRejected+",\"probeNoEkuAssessment\":\""+assessmentProbe+"\",\"probeExplicitEkuAssessment\":\""+purposeAssessment+"\",\"probeParameters\":"+(parametersProbe!=null)+",\"probeNonemptyParameterChain\":"+nonemptyParameterChain+",\"crlWrongIssuerName\":\""+b64(mismatchedCrl)+"\",\"authCrlIssuerMismatchRejected\":"+crlAuthorityRejects+",\"authOcspBadSignatureRejected\":"+ocspSignatureRejects+",\"authUnsupportedTokenRejected\":"+unsupportedTokenRejects+",\"ocspDelegatedByName\":\""+b64(ocspSignedBy(delegatedKey,delegated,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000,true,true))+"\",\"ocspDelegatedNoEku\":\""+b64(ocspSignedBy(noEkuKey,noEku,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedWrongEku\":\""+b64(ocspSignedBy(wrongEkuKey,wrongEku,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedNoDigitalSignature\":\""+b64(ocspSignedBy(noDigitalKey,noDigital,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedNoKeyUsage\":\""+b64(ocspSignedBy(noKeyUsageKey,noKeyUsage,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedFuture\":\""+b64(ocspSignedBy(futureKey,future,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedWrongIssuer\":\""+b64(ocspSignedBy(wrongIssuerKey,wrongIssuer,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedWrongIssuerName\":\""+b64(ocspSignedBy(wrongIssuerNameKey,wrongIssuerName,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000))+"\",\"ocspDelegatedNoCertificate\":\""+b64(ocspSignedBy(delegatedKey,delegated,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000,false,false))+"\",\"ocspDelegatedMismatchedResponderId\":\""+b64(ocspSignedBy(delegatedKey,delegated,c,CertificateStatus.GOOD,BASE-1000,BASE+3600000,true,true,new X500Name("CN=Unmatched responder")))+"\",\"ocspDelegatedBadSignature\":\""+b64(badSignature)+"\",\"ocspNoThisUpdate\":\""+b64(ocspSignedBy(k,c,c,CertificateStatus.GOOD,0,BASE+3600000))+"\""; json=json.substring(0,json.length()-1)+extra+"}";
    json=json.substring(0,json.length()-1)+",\"p4Fuzz007Cases\":"+fuzzCount+",\"p4Fuzz007Seed\":"+pkiFuzzSeed+",\"p4Fuzz007CorpusSha256\":\""+java.util.HexFormat.of().formatHex(pkiCorpus.digest())+"\",\"p4Fuzz008Cases\":"+fuzzCount+",\"p4Fuzz008Seed\":"+protocolFuzzSeed+",\"p4Fuzz008CorpusSha256\":\""+java.util.HexFormat.of().formatHex(protocolCorpus.digest())+"\"}";
    System.out.println(json);
  }
}
`;

const policy = {
  validationTimeMs: Date.parse("2026-09-26T12:00:00Z"),
  maximumRevocationAgeSeconds: 86_400,
  crlEvidence: [new Uint8Array([1])],
  ocspEvidence: [],
};

test("PKI observation requires evidence and a fresh caller-time interval", () => {
  assert.equal(
    normalizePkiObservation(
      {
        status: "valid",
        thisUpdateMs: policy.validationTimeMs - 1000,
        nextUpdateMs: policy.validationTimeMs + 1000,
      },
      policy,
    ).status,
    "valid",
  );
  assert.equal(
    normalizePkiObservation(
      {
        status: "valid",
        thisUpdateMs: policy.validationTimeMs + 1,
        nextUpdateMs: policy.validationTimeMs + 1000,
      },
      policy,
    ).status,
    "stale",
  );
  assert.equal(
    normalizePkiObservation(
      {
        status: "valid",
        thisUpdateMs: policy.validationTimeMs - 86_400_001,
        nextUpdateMs: policy.validationTimeMs + 1000,
      },
      policy,
    ).status,
    "stale",
  );
  assert.equal(
    normalizePkiObservation(
      {
        status: "valid",
        thisUpdateMs: policy.validationTimeMs - 1000,
        nextUpdateMs: policy.validationTimeMs - 1,
      },
      policy,
    ).status,
    "stale",
  );
});

test("certificate policy keeps chain, trust, time, use, identity and authorization distinct", () => {
  const assessment = normalizeCertificateAssessment({
    chain: "valid",
    trust: "indeterminate",
    time: "valid",
    usage: "valid",
    extendedKeyUsage: "indeterminate",
    identity: "valid",
    authorization: "indeterminate",
    algorithm: "valid",
  });
  assert.equal(assessment.status, "indeterminate");
  assert.deepEqual(assessment.outcomes, {
    chain: "valid",
    trust: "indeterminate",
    time: "valid",
    usage: "valid",
    extendedKeyUsage: "indeterminate",
    identity: "valid",
    authorization: "indeterminate",
    algorithm: "valid",
  });
  assert.equal(normalizeCertificateAssessment(null).status, "indeterminate");
});

test("revoked is terminal and unknown, absent and malformed never become valid", () => {
  assert.equal(
    normalizePkiObservation({ status: "revoked" }, policy).status,
    "revoked",
  );
  assert.equal(
    normalizePkiObservation({ status: "unknown" }, policy).status,
    "unknown",
  );
  assert.equal(
    normalizePkiObservation({ status: "absent" }, policy).status,
    "absent",
  );
  assert.equal(normalizePkiObservation(null, policy).status, "unknown");
  assert.equal(
    normalizePkiObservation(
      { status: "valid", thisUpdateMs: 1, nextUpdateMs: 2 },
      { ...policy, crlEvidence: [], ocspEvidence: [] },
    ).status,
    "absent",
  );
});

test("P4-PROP-013 revocation uncertainty never upgrades to valid (4096 cases)", () => {
  let state = 0x50444101 ^ 0x05044013;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
  const evidence = [new Uint8Array([0x01])];
  for (let index = 0; index < 4096; index += 1) {
    const validationTimeMs = Date.parse("2026-09-26T10:00:00Z");
    const maximumRevocationAgeSeconds = 1 + Math.floor(next() * 172_800);
    const policy = {
      validationTimeMs,
      maximumRevocationAgeSeconds,
      crlEvidence: evidence,
      ocspEvidence: [],
    };
    const uncertain = [
      null,
      { status: "unknown" },
      { status: "absent" },
      { status: "stale", thisUpdateMs: validationTimeMs - 1 },
      { status: "unsupported" },
      {
        status: "valid",
        thisUpdateMs: validationTimeMs + 1 + Math.floor(next() * 60_000),
        nextUpdateMs: validationTimeMs + 60_000,
      },
      {
        status: "valid",
        thisUpdateMs:
          validationTimeMs -
          maximumRevocationAgeSeconds * 1_000 -
          1 -
          Math.floor(next() * 60_000),
        nextUpdateMs: validationTimeMs + 60_000,
      },
      {
        status: "valid",
        thisUpdateMs: validationTimeMs - 60_000,
        nextUpdateMs: validationTimeMs - 1,
      },
    ];
    for (const observation of uncertain)
      assert.notEqual(
        normalizePkiObservation(observation, policy).status,
        "valid",
        `case=${index}`,
      );
    assert.equal(
      normalizePkiObservation({ status: "revoked" }, policy).status,
      "revoked",
      `case=${index}`,
    );
  }
});

test("P4-FUZZ-008 bridge protocol parser is total and bounded (seed=1430257929)", () => {
  const fuzzSeed = 0x50444101 ^ 0x05044008;
  let state = fuzzSeed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
  const corpus = createHash("sha256");
  const validRequest = {
    command: "VERIFY",
    editionId: "rrsif-2026-09-21-authoritative-candidate",
    profileId: "AEAT-XADES-EPES-v0.1.5",
    targetName: "RegistroAlta",
    artifactDigestSha256: "0".repeat(64),
    artifactBytes: new Uint8Array([0x3c, 0x61, 0x2f, 0x3e]),
    signerCertificateDer: new Uint8Array(),
    certificateChainDer: [],
    signatureBytes: new Uint8Array(),
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
  };
  for (let index = 0; index < 4096; index += 1) {
    const bytes = new Uint8Array(Math.floor(next() * 513));
    for (let offset = 0; offset < bytes.length; offset += 1)
      bytes[offset] = Math.floor(next() * 256);
    corpus.update(bytes);
    const decoded = decodeResponse(bytes);
    assert.equal(typeof decoded.kind, "string", `case=${index}`);
    assert.ok(decoded.payload instanceof Uint8Array, `case=${index}`);
    assert.ok(decoded.payload.byteLength <= 8_388_608, `case=${index}`);
    const encoded = encodeRequest({
      ...validRequest,
      command: index % 4 === 0 ? "BAD" : validRequest.command,
      artifactBytes: bytes,
      crlEvidence: index % 3 === 0 ? [bytes] : [],
      ocspEvidence: index % 3 === 1 ? [bytes] : [],
    });
    assert.ok(
      encoded === null || encoded instanceof Uint8Array,
      `case=${index}`,
    );
    if (encoded) {
      assert.ok(encoded.byteLength <= 24_000_000, `case=${index}`);
      corpus.update(encoded);
    }
  }
  assert.match(corpus.digest("hex"), /^[a-f0-9]{64}$/u);
});

function archiveEntry(archive, wantedName) {
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.notEqual(end, -1);
  const entries = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  for (let index = 0; index < entries; index += 1) {
    assert.equal(archive.readUInt32LE(offset), 0x02014b50);
    const compressedBytes = archive.readUInt32LE(offset + 20);
    const nameBytes = archive.readUInt16LE(offset + 28);
    const extraBytes = archive.readUInt16LE(offset + 30);
    const commentBytes = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString("utf8", offset + 46, offset + 46 + nameBytes);
    if (name === wantedName) {
      const dataStart =
        localOffset +
        30 +
        archive.readUInt16LE(localOffset + 26) +
        archive.readUInt16LE(localOffset + 28);
      assert.equal(archive.readUInt16LE(offset + 10), 8);
      return new Uint8Array(
        inflateRawSync(
          archive.subarray(dataStart, dataStart + compressedBytes),
        ),
      );
    }
    offset += 46 + nameBytes + extraBytes + commentBytes;
  }
  assert.fail(`missing official XAdES vector: ${wantedName}`);
}

async function generatePkiFixtures() {
  const directory = await mkdtemp(join(tmpdir(), "verifactu-p4d-pki-"));
  try {
    const source = join(directory, "PkiFixtureGenerator.java");
    await writeFile(source, fixtureGenerator);
    const jarPath =
      process.env.VERIFACTU_DSS_JAR ??
      resolve(
        "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
      );
    const agent = process.env.VERIFACTU_JACOCO_AGENT;
    const destination = process.env.VERIFACTU_JACOCO_DESTFILE;
    assert.equal(agent === undefined, destination === undefined);
    const javaCoverageOptions =
      agent === undefined
        ? []
        : [
            `-javaagent:${agent}=destfile=${destination},append=true,includes=eu.noeos.verifactu.bridge.*`,
          ];
    const result = spawnSync(
      process.env.VERIFACTU_JAVA ?? "java",
      [...javaCoverageOptions, "--class-path", jarPath, source],
      {
        encoding: "utf8",
        timeout: 15_000,
        maxBuffer: 1_000_000,
      },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    try {
      return JSON.parse(result.stdout.trim());
    } catch (error) {
      throw new Error(
        `${error.message}; output tail=${result.stdout.slice(-300)}`,
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("exact DSS bridge verifies official XAdES structure and signature without inventing trust", async () => {
  const archive = readFileSync(
    "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
  );
  const artifactBytes = archiveEntry(
    archive,
    "ejemploRegistro-firmado-epes-xades4j.xml",
  );
  const provider = createXadesProvider();
  const request = {
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    artifactBytes,
    artifactDigestSha256: createHash("sha256")
      .update(artifactBytes)
      .digest("hex"),
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    validationTime: "2025-02-04T00:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  };
  const result = await provider.verify(request);
  assert.equal(result.profile, "valid", result.diagnostics.join(","));
  assert.equal(result.cryptographic, "valid");
  assert.equal(result.certificate, "indeterminate");
  assert.equal(result.certificatePolicy.identity, "indeterminate");
  assert.equal(result.certificatePolicy.authorization, "indeterminate");
  assert.equal(result.revocation, "absent");
  assert.equal(result.status, "indeterminate");

  const signedXml = new TextDecoder().decode(artifactBytes);
  const profileMutations = [
    (xml) =>
      xml.replace(
        'Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"',
        'Algorithm="urn:unsupported"',
      ),
    (xml) =>
      xml.replace(
        'Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"',
        'Algorithm="urn:unsupported"',
      ),
    (xml) => xml.replace('URI=""', 'URI="#unexpected"'),
    (xml) =>
      xml.replace(
        'Type="http://uri.etsi.org/01903#SignedProperties"',
        'Type="urn:unsupported"',
      ),
    (xml) => xml.replace("urn:oid:2.16.724.1.3.1.1.2.1.9", "urn:oid:1.2.3"),
    (xml) =>
      xml.replace(
        "https://sede.administracion.gob.es/politica_de_firma_anexo_1.pdf",
        "https://example.invalid/policy.pdf",
      ),
    (xml) =>
      xml.replace(
        /<xades:UnsignedSignatureProperties\b/u,
        "<xades:UnsignedProperties><xades:UnsignedSignatureProperties",
      ),
    (xml) => xml.replace("<ds:KeyInfo>", "<ds:KeyInfo><ds:KeyValue/>"),
    (xml) => xml.replace("<ds:Signature ", '<ds:Signature Id="wrong" '),
  ];
  let rejectedProfiles = 0;
  for (const mutate of profileMutations) {
    const changed = mutate(signedXml);
    if (changed === signedXml) continue;
    const bytes = new TextEncoder().encode(changed);
    const rejected = await provider.verify({
      ...request,
      artifactBytes: bytes,
      artifactDigestSha256: createHash("sha256").update(bytes).digest("hex"),
    });
    assert.equal(rejected.profile, "invalid");
    rejectedProfiles += 1;
  }
  assert.ok(rejectedProfiles >= 5);

  const tamperedText = new TextDecoder()
    .decode(artifactBytes)
    .replace(
      "<sum1:TipoFactura>R3</sum1:TipoFactura>",
      "<sum1:TipoFactura>F1</sum1:TipoFactura>",
    );
  assert.notEqual(tamperedText, new TextDecoder().decode(artifactBytes));
  const tampered = new TextEncoder().encode(tamperedText);
  const negative = await provider.verify({
    ...request,
    artifactBytes: tampered,
    artifactDigestSha256: createHash("sha256").update(tampered).digest("hex"),
  });
  assert.equal(negative.cryptographic, "invalid");
});

test("DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence", async () => {
  const fixture = await generatePkiFixtures();
  assert.equal(fixture.p4Fuzz007Cases, 4096);
  assert.equal(fixture.p4Fuzz007Seed, 0x50444607);
  assert.match(fixture.p4Fuzz007CorpusSha256, /^[a-f0-9]{64}$/u);
  assert.equal(fixture.p4Fuzz008Cases, 4096);
  assert.equal(fixture.p4Fuzz008Seed, 0x50444608);
  assert.match(fixture.p4Fuzz008CorpusSha256, /^[a-f0-9]{64}$/u);
  assert.equal(fixture.probeChildNull, true);
  assert.equal(fixture.probeChildrenNull, true);
  assert.equal(fixture.probeOptionalKeyValue, true);
  assert.equal(fixture.probeDirectSignatureAbsent, true);
  assert.equal(fixture.probeMalformedKeyValueRejected, true);
  assert.equal(fixture.probeNoIssuer, true);
  assert.equal(fixture.probeUniqueIssuer, true);
  assert.equal(fixture.probeAmbiguousIssuer, true);
  assert.equal(fixture.probeChain, "VALID");
  assert.equal(fixture.probeChainDuplicateRejected, true);
  assert.equal(fixture.probeChainAmbiguityRejected, true);
  assert.equal(fixture.probeTrust, "VALID");
  assert.equal(fixture.probeNoAnchorTrust, "INDETERMINATE");
  assert.equal(fixture.probeTime, "VALID");
  assert.equal(fixture.probeExpiredTime, "INVALID");
  assert.equal(fixture.probeZeroLengthXmlRejected, true);
  assert.equal(fixture.probeOverLimitXmlRejected, true);
  assert.match(fixture.probeNoEkuAssessment, /extendedKeyUsage=VALID/u);
  assert.match(
    fixture.probeExplicitEkuAssessment,
    /extendedKeyUsage=INDETERMINATE/u,
  );
  assert.equal(fixture.probeParameters, true);
  assert.equal(fixture.probeNonemptyParameterChain, true);
  assert.equal(fixture.authCrlIssuerMismatchRejected, true);
  assert.equal(fixture.authOcspBadSignatureRejected, true);
  assert.equal(fixture.authUnsupportedTokenRejected, true);
  const certificateDer = new Uint8Array(
    Buffer.from(fixture.certificate, "base64"),
  );
  const privateKey = createPrivateKey({
    key: Buffer.from(fixture.privateKey, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const artifactBytes = new TextEncoder().encode(
    '<sum1:RegistroAlta xmlns:sum1="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd"><sum1:IDVersion>1.0</sum1:IDVersion></sum1:RegistroAlta>',
  );
  const provider = createXadesProvider();
  const signer = {
    keyHandle: "ephemeral-test-key:sign-1",
    certificateDer,
    certificateChainDer: [],
    sign: async (data, request) => {
      assert.equal(request.algorithm, "RSA-SHA256");
      return new Uint8Array(
        signBytes("sha256", data, {
          key: privateKey,
          padding: constants.RSA_PKCS1_PADDING,
        }),
      );
    },
  };
  const signRequest = {
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    artifactBytes,
    artifactDigestSha256: createHash("sha256")
      .update(artifactBytes)
      .digest("hex"),
    signingTime: "2026-09-26T09:30:00Z",
    signer,
    trustAnchorsDer: [certificateDer],
    crlEvidence: [new Uint8Array(Buffer.from(fixture.crlGood, "base64"))],
    ocspEvidence: [],
    validationTime: "2026-09-26T10:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  };
  const duplicateIds = new TextEncoder().encode(
    new TextDecoder()
      .decode(artifactBytes)
      .replace("<sum1:IDVersion>", '<sum1:IDVersion Id="duplicate">')
      .replace(
        "</sum1:IDVersion>",
        '</sum1:IDVersion><sum1:Other Id="duplicate"/>',
      ),
  );
  const alreadySigned = new TextEncoder().encode(
    `${new TextDecoder().decode(artifactBytes).replace("</sum1:RegistroAlta>", "")}<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"/></sum1:RegistroAlta>`,
  );
  for (const [name, bytes] of [
    ["duplicate IDs", duplicateIds],
    ["existing signature", alreadySigned],
  ]) {
    const rejected = await provider.sign({
      ...signRequest,
      artifactBytes: bytes,
      artifactDigestSha256: createHash("sha256").update(bytes).digest("hex"),
    });
    assert.equal(rejected.status, "invalid", name);
    assert.equal(rejected.diagnostics[0], "DIAG-XADES-TARGET", name);
  }
  const signed = await provider.sign(signRequest);
  assert.equal(signed.status, "signed", JSON.stringify(signed));
  assert.ok(signed.bytes instanceof Uint8Array);
  assert.equal(signed.verification.status, "valid");
  assert.deepEqual(signed.verification.certificatePolicy, {
    chain: "valid",
    trust: "valid",
    time: "valid",
    usage: "valid",
    extendedKeyUsage: "valid",
    identity: "valid",
    authorization: "indeterminate",
    algorithm: "valid",
  });

  const purposeCertificateDer = new Uint8Array(
    Buffer.from(fixture.purposeCertificate, "base64"),
  );
  const purposePrivateKey = createPrivateKey({
    key: Buffer.from(fixture.purposePrivateKey, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const explicitPurpose = await provider.sign({
    ...signRequest,
    signer: {
      ...signer,
      certificateDer: purposeCertificateDer,
      sign: async (data) =>
        new Uint8Array(
          signBytes("sha256", data, {
            key: purposePrivateKey,
            padding: constants.RSA_PKCS1_PADDING,
          }),
        ),
    },
    trustAnchorsDer: [purposeCertificateDer],
    crlEvidence: [],
  });
  assert.equal(explicitPurpose.status, "signed");
  assert.equal(
    explicitPurpose.verification.certificatePolicy.extendedKeyUsage,
    "indeterminate",
  );
  assert.equal(explicitPurpose.verification.certificate, "indeterminate");

  const verifyBase = {
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    artifactBytes: signed.bytes,
    artifactDigestSha256: createHash("sha256")
      .update(signed.bytes)
      .digest("hex"),
    expectedSignerFingerprintSha256: createHash("sha256")
      .update(certificateDer)
      .digest("hex"),
    trustAnchorsDer: [certificateDer],
    validationTime: "2026-09-26T10:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  };
  const selfSignedWithoutTrust = await provider.verify({
    ...verifyBase,
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
  });
  assert.equal(selfSignedWithoutTrust.certificatePolicy.chain, "valid");
  assert.equal(selfSignedWithoutTrust.certificatePolicy.trust, "indeterminate");
  assert.equal(selfSignedWithoutTrust.certificatePolicy.identity, "valid");

  const wrongIssuerDer = new Uint8Array(
    Buffer.from(fixture.otherCertificate, "base64"),
  );
  const wrongChain = await provider.verify({
    ...verifyBase,
    certificateChainDer: [wrongIssuerDer],
    trustAnchorsDer: [wrongIssuerDer],
    crlEvidence: [],
    ocspEvidence: [],
  });
  assert.equal(wrongChain.certificatePolicy.chain, "invalid");
  assert.equal(wrongChain.certificatePolicy.trust, "indeterminate");

  const ocspGood = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspGood, "base64"))],
  });
  assert.equal(ocspGood.status, "valid", JSON.stringify(ocspGood));
  assert.equal(ocspGood.revocation, "valid");

  const suppliedChainWithOcsp = await provider.verify({
    ...verifyBase,
    certificateChainDer: [certificateDer],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspGood, "base64"))],
    crlEvidence: [],
  });
  assert.equal(
    suppliedChainWithOcsp.status,
    "valid",
    JSON.stringify(suppliedChainWithOcsp),
  );

  const delegatedOcsp = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [
      new Uint8Array(Buffer.from(fixture.ocspDelegated, "base64")),
    ],
  });
  assert.equal(delegatedOcsp.status, "valid", JSON.stringify(delegatedOcsp));
  assert.equal(delegatedOcsp.revocation, "valid");

  const delegatedByName = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [
      new Uint8Array(Buffer.from(fixture.ocspDelegatedByName, "base64")),
    ],
  });
  assert.equal(
    delegatedByName.status,
    "valid",
    JSON.stringify(delegatedByName),
  );

  for (const [name, key] of [
    ["missing OCSP signing EKU", "ocspDelegatedNoEku"],
    ["wrong OCSP signing EKU", "ocspDelegatedWrongEku"],
    [
      "missing OCSP digitalSignature key usage",
      "ocspDelegatedNoDigitalSignature",
    ],
    ["not-yet-valid OCSP responder", "ocspDelegatedFuture"],
    [
      "OCSP responder certificate signed by another key",
      "ocspDelegatedWrongIssuer",
    ],
    [
      "OCSP response omits delegated responder certificate",
      "ocspDelegatedNoCertificate",
    ],
    [
      "OCSP responder ID does not match its certificate",
      "ocspDelegatedMismatchedResponderId",
    ],
    [
      "OCSP response signature does not match responder key",
      "ocspDelegatedBadSignature",
    ],
    [
      "OCSP responder certificate has a different issuer name",
      "ocspDelegatedWrongIssuerName",
    ],
  ]) {
    const rejectedResponder = await provider.verify({
      ...verifyBase,
      crlEvidence: [],
      ocspEvidence: [new Uint8Array(Buffer.from(fixture[key], "base64"))],
    });
    assert.equal(
      rejectedResponder.status,
      "indeterminate",
      `${name}: ${JSON.stringify(rejectedResponder)}`,
    );
    assert.equal(rejectedResponder.revocation, "unknown", name);
  }

  const ocspLater = await provider.verify({
    ...verifyBase,
    validationTime: "2026-09-26T12:00:00Z",
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspStale, "base64"))],
  });
  assert.equal(ocspLater.status, "indeterminate", JSON.stringify(ocspLater));
  assert.equal(ocspLater.revocation, "stale");

  const futureOcsp = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspFuture, "base64"))],
  });
  assert.equal(futureOcsp.status, "indeterminate", JSON.stringify(futureOcsp));
  assert.equal(futureOcsp.revocation, "stale");

  const ocspWithoutNextUpdate = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [
      new Uint8Array(Buffer.from(fixture.ocspNoNextUpdate, "base64")),
    ],
  });
  assert.equal(
    ocspWithoutNextUpdate.status,
    "indeterminate",
    JSON.stringify(ocspWithoutNextUpdate),
  );
  assert.equal(ocspWithoutNextUpdate.revocation, "stale");

  const ocspWithoutThisUpdate = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [
      new Uint8Array(Buffer.from(fixture.ocspNoThisUpdate, "base64")),
    ],
  });
  assert.equal(
    ocspWithoutThisUpdate.status,
    "indeterminate",
    JSON.stringify(ocspWithoutThisUpdate),
  );
  assert.equal(ocspWithoutThisUpdate.revocation, "stale");

  const wrongIssuerNameCrl = await provider.verify({
    ...verifyBase,
    crlEvidence: [
      new Uint8Array(Buffer.from(fixture.crlWrongIssuerName, "base64")),
    ],
    ocspEvidence: [],
  });
  assert.equal(
    wrongIssuerNameCrl.status,
    "indeterminate",
    JSON.stringify(wrongIssuerNameCrl),
  );
  assert.equal(wrongIssuerNameCrl.revocation, "unknown");

  const ambiguousIssuer = await provider.verify({
    ...verifyBase,
    certificateChainDer: [wrongIssuerDer],
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspGood, "base64"))],
  });
  assert.equal(
    ambiguousIssuer.revocation,
    "unknown",
    JSON.stringify(ambiguousIssuer),
  );

  for (const [name, evidence] of [
    ["good status from unauthorized responder", fixture.ocspWrongResponder],
    [
      "revoked status from unauthorized responder",
      fixture.ocspWrongResponderRevoked,
    ],
  ]) {
    const unauthorized = await provider.verify({
      ...verifyBase,
      crlEvidence: [],
      ocspEvidence: [new Uint8Array(Buffer.from(evidence, "base64"))],
    });
    assert.equal(
      unauthorized.status,
      "indeterminate",
      `${name}: ${JSON.stringify(unauthorized)}`,
    );
    assert.equal(unauthorized.revocation, "unknown", name);
  }

  const maximumAgeFailure = await provider.verify({
    ...verifyBase,
    maximumRevocationAgeSeconds: 1,
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspGood, "base64"))],
  });
  assert.equal(
    maximumAgeFailure.revocation,
    "stale",
    JSON.stringify(maximumAgeFailure),
  );

  const ocspUnknown = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspUnknown, "base64"))],
  });
  assert.equal(
    ocspUnknown.status,
    "indeterminate",
    JSON.stringify(ocspUnknown),
  );
  assert.equal(ocspUnknown.revocation, "unknown");

  for (const evidence of [fixture.crlStale, fixture.crlWrongIssuer]) {
    const uncertain = await provider.verify({
      ...verifyBase,
      crlEvidence: [new Uint8Array(Buffer.from(evidence, "base64"))],
      ocspEvidence: [],
    });
    assert.equal(uncertain.status, "indeterminate", JSON.stringify(uncertain));
    assert.ok(["stale", "unknown"].includes(uncertain.revocation));
  }

  const ocspRevoked = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [new Uint8Array(Buffer.from(fixture.ocspRevoked, "base64"))],
  });
  assert.equal(ocspRevoked.status, "invalid", JSON.stringify(ocspRevoked));
  assert.equal(ocspRevoked.revocation, "revoked");

  const malformed = await provider.verify({
    ...verifyBase,
    crlEvidence: [],
    ocspEvidence: [new Uint8Array([1, 2, 3])],
  });
  assert.equal(malformed.status, "indeterminate", JSON.stringify(malformed));
  assert.equal(malformed.revocation, "unknown");

  const crlRevoked = await provider.verify({
    ...verifyBase,
    crlEvidence: [new Uint8Array(Buffer.from(fixture.crlRevoked, "base64"))],
    ocspEvidence: [],
  });
  assert.equal(crlRevoked.status, "invalid", JSON.stringify(crlRevoked));
  assert.equal(crlRevoked.revocation, "revoked");
});
