package eu.noeos.verifactu.bridge;

import eu.europa.esig.dss.enumerations.DigestAlgorithm;
import eu.europa.esig.dss.enumerations.SignatureAlgorithm;
import eu.europa.esig.dss.enumerations.SignatureLevel;
import eu.europa.esig.dss.enumerations.SignaturePackaging;
import eu.europa.esig.dss.model.InMemoryDocument;
import eu.europa.esig.dss.model.Policy;
import eu.europa.esig.dss.model.SignatureValue;
import eu.europa.esig.dss.spi.validation.CommonCertificateVerifier;
import eu.europa.esig.dss.spi.validation.RevocationDataVerifier;
import eu.europa.esig.dss.spi.x509.CommonCertificateSource;
import eu.europa.esig.dss.spi.x509.CommonTrustedCertificateSource;
import eu.europa.esig.dss.spi.x509.revocation.crl.ExternalResourcesCRLSource;
import eu.europa.esig.dss.spi.x509.revocation.ocsp.ExternalResourcesOCSPSource;
import eu.europa.esig.dss.spi.x509.revocation.crl.CRLToken;
import eu.europa.esig.dss.spi.x509.revocation.ocsp.OCSPToken;
import eu.europa.esig.dss.spi.x509.revocation.RevocationToken;
import eu.europa.esig.dss.enumerations.CertificateStatus;
import eu.europa.esig.dss.validation.SignedDocumentValidator;
import eu.europa.esig.dss.xades.XAdESSignatureParameters;
import eu.europa.esig.dss.xades.reference.DSSReference;
import eu.europa.esig.dss.xades.reference.EnvelopedSignatureTransform;
import eu.europa.esig.dss.xades.dataobject.DSSDataObjectFormat;
import eu.europa.esig.dss.xades.signature.XAdESService;
import eu.europa.esig.dss.model.x509.CertificateToken;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.MessageDigest;
import java.security.Permission;
import java.net.SocketPermission;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;
import java.security.KeyStore;
import java.security.cert.CertPath;
import java.security.cert.CertPathBuilder;
import java.security.cert.CertStore;
import java.security.cert.CollectionCertStoreParameters;
import java.security.cert.PKIXBuilderParameters;
import java.security.cert.TrustAnchor;
import java.security.cert.X509CertSelector;
import java.security.cert.X509CRL;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509CertificateHolder;
import org.bouncycastle.cert.ocsp.BasicOCSPResp;
import org.bouncycastle.cert.ocsp.CertificateID;
import org.bouncycastle.cert.ocsp.RespID;
import org.bouncycastle.operator.DigestCalculatorProvider;
import org.bouncycastle.operator.jcajce.JcaContentVerifierProviderBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import javax.xml.XMLConstants;
import javax.xml.crypto.KeySelector;
import javax.xml.crypto.KeySelectorException;
import javax.xml.crypto.KeySelectorResult;
import javax.xml.crypto.XMLCryptoContext;
import javax.xml.crypto.dsig.XMLSignature;
import javax.xml.crypto.dsig.XMLSignatureFactory;
import javax.xml.crypto.dsig.dom.DOMValidateContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXParseException;

/** Private bounded stdin/stdout bridge. The process receives no private key material. */
public final class DssBridge {
  private static final int MAX_LINE = 32_000_000;
  private static final long MAX_REQUEST = 24_000_000L;
  private static final byte[] POLICY_DIGEST = Base64.getDecoder().decode("G7roucf600+f03r/o0bAOQ6WAs0=");
  private static final String C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";

  private DssBridge() {}

  public static void main(String[] args) {
    try {
      installNetworkDenyPolicy();
      Request request = Request.read(System.in);
      Response response = dispatch(request);
      response.write(System.out);
    } catch (LimitException exception) {
      new Response("LIMIT", "DIAG-XADES-REQUEST-BYTES", new byte[0]).write(System.out);
    } catch (Exception exception) {
      new Response("DEFECT", "DIAG-XADES-BRIDGE", new byte[0]).write(System.out);
    }
  }

  @SuppressWarnings("removal")
  private static void installNetworkDenyPolicy() {
    System.setErr(new PrintStream(OutputStream.nullOutputStream()));
    System.setSecurityManager(new SecurityManager() {
      @Override public void checkPermission(Permission permission) {
        if (permission instanceof SocketPermission) throw new SecurityException("network access disabled");
      }
    });
  }

  private static Response dispatch(Request r) throws Exception {
    if (!"VERIFACTU-DSS-1".equals(r.protocol)
        || !"rrsif-2026-09-21-authoritative-candidate".equals(r.edition)
        || !"AEAT-XADES-EPES-v0.1.5".equals(r.profile)
        || !List.of("RegistroAlta", "RegistroAnulacion", "RegistroEvento").contains(r.target)
        || r.artifact.length == 0 || r.artifact.length > 8_388_608) {
      return new Response("INVALID", "DIAG-XADES-REQUEST", new byte[0]);
    }
    if (!hex(MessageDigest.getInstance("SHA-256").digest(r.artifact)).equals(r.digest))
      return new Response("INVALID", "DIAG-XADES-DIGEST", new byte[0]);
    if (!boundedEvidence(r)) return new Response("LIMIT", "DIAG-XADES-EVIDENCE-BYTES", new byte[0]);
    if ("SIGN_PREPARE".equals(r.command)) {
      if (r.signerCertificate.length == 0)
        return new Response("INVALID", "DIAG-XADES-CERTIFICATE", new byte[0]);
      if (r.signingTime > r.validationTime || r.maximumAge <= 0 || r.maximumAge > 172_800)
        return new Response("INVALID", "DIAG-XADES-REQUEST", new byte[0]);
      try {
        if (!validateUnsignedTarget(parseXml(r.artifact), r.target))
          return new Response("INVALID", "DIAG-XADES-TARGET", new byte[0]);
      } catch (LimitException limit) { throw limit; }
      catch (Exception malformed) { return new Response("INVALID", "DIAG-XADES-XML", new byte[0]); }
      XAdESSignatureParameters parameters = parameters(r);
      XAdESService service = new XAdESService(new CommonCertificateVerifier(true));
      byte[] tbs = service.getDataToSign(new InMemoryDocument(r.artifact, "artifact.xml"), parameters).getBytes();
      return new Response("TBS", "NONE", tbs);
    }
    if ("SIGN_COMPLETE".equals(r.command)) {
      if (r.signerCertificate.length == 0 || r.signature.length < 128 || r.signature.length > 1_024)
        return new Response("INVALID", "DIAG-XADES-SIGNATURE", new byte[0]);
      XAdESSignatureParameters parameters = parameters(r);
      XAdESService service = new XAdESService(new CommonCertificateVerifier(true));
      InMemoryDocument source = new InMemoryDocument(r.artifact, "artifact.xml");
      var signed = service.signDocument(source, parameters,
          new SignatureValue(SignatureAlgorithm.RSA_SHA256, r.signature));
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      signed.writeTo(output);
      return new Response("SIGNED", "NONE", output.toByteArray());
    }
    if ("VERIFY".equals(r.command)) {
      return verify(r);
    }
    return new Response("INVALID", "DIAG-XADES-COMMAND", new byte[0]);
  }

  private static boolean boundedEvidence(Request r) {
    if (r.signerCertificate.length > 1_048_576 || r.chain.size() + (r.signerCertificate.length == 0 ? 0 : 1) > 16
        || r.anchors.size() + r.crls.size() + r.ocsps.size() > 16) return false;
    long total = (long) r.artifact.length + r.signerCertificate.length;
    List<byte[]> certificates = new ArrayList<>(r.chain); certificates.addAll(r.anchors);
    for (byte[] value : certificates) {
      if (value.length == 0 || value.length > 1_048_576) return false;
      total += value.length;
    }
    for (byte[] value : r.crls) { if (value.length == 0) return false; total += value.length; }
    for (byte[] value : r.ocsps) { if (value.length == 0) return false; total += value.length; }
    return total <= 8_388_608L;
  }

  private static Response verify(Request r) throws Exception {
    Document document;
    try { document = parseXml(r.artifact); }
    catch (LimitException limit) { throw limit; }
    catch (Exception malformed) { return report("INVALID", "INVALID", "NOT_EVALUATED", "INDETERMINATE", "DIAG-XADES-XML", "UNKNOWN", 0, 0); }
    if (!validateProfile(document, r.target))
      return report("INVALID", "INVALID", "NOT_EVALUATED", "INDETERMINATE", "DIAG-XADES-PROFILE", "UNKNOWN", 0, 0);

    Element root = document.getDocumentElement();
    Element signatureElement = directSignature(root);
    List<X509Certificate> embedded = certificates(signatureElement);
    if (embedded.isEmpty()) return report("INDETERMINATE", "VALID", "NOT_EVALUATED", "INDETERMINATE", "DIAG-XADES-CERTIFICATE", "UNKNOWN", 0, 0);
    X509Certificate leaf = embedded.get(0);
    if (!keyValueMatches(signatureElement, leaf))
      return report("INVALID", "VALID", "NOT_EVALUATED", "INVALID",
          new CertificateAssessment("NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED",
              "NOT_EVALUATED", "INVALID", "NOT_EVALUATED", "NOT_EVALUATED"),
          "DIAG-XADES-KEYINFO", "UNKNOWN", 0, 0);
    if (!r.fingerprint.isEmpty() && !hex(MessageDigest.getInstance("SHA-256").digest(leaf.getEncoded())).equals(r.fingerprint))
      return report("INVALID", "VALID", "NOT_EVALUATED", "INVALID",
          new CertificateAssessment("NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED",
              "NOT_EVALUATED", "INVALID", "NOT_EVALUATED", "NOT_EVALUATED"),
          "DIAG-XADES-SIGNER", "UNKNOWN", 0, 0);
    if (!(leaf.getPublicKey() instanceof java.security.interfaces.RSAKey rsa) || rsa.getModulus().bitLength() < 1024)
      return report("INVALID", "VALID", "NOT_EVALUATED", "INVALID",
          new CertificateAssessment("NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED",
              "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED", "INVALID"),
          "DIAG-XADES-ALGORITHM", "UNKNOWN", 0, 0);

    for (Element item : elements(document.getDocumentElement())) {
      if (item.hasAttribute("Id")) item.setIdAttribute("Id", true);
      if (item.hasAttribute("ID")) item.setIdAttribute("ID", true);
      if (item.hasAttribute("id")) item.setIdAttribute("id", true);
    }
    boolean cryptoValid;
    try {
      DOMValidateContext context = new DOMValidateContext(new FixedCertificateKeySelector(leaf), signatureElement);
      context.setProperty("org.jcp.xml.dsig.secureValidation", Boolean.TRUE);
      XMLSignature signature = XMLSignatureFactory.getInstance("DOM").unmarshalXMLSignature(context);
      cryptoValid = signature.validate(context);
    } catch (Exception invalidSignature) {
      cryptoValid = false;
    }
    if (!cryptoValid) return report("INVALID", "VALID", "INVALID", "INDETERMINATE", "DIAG-XADES-CRYPTO", "UNKNOWN", 0, 0);

    RevocationResult revocationResult = validateRevocation(leaf, embedded, r);
    CertificateAssessment certificateAssessment = assessCertificate(leaf, embedded, r);
    boolean dssValid = validateWithDss(r);
    if ("VALID".equals(certificateAssessment.trust) && !dssValid)
      certificateAssessment = certificateAssessment.withTrust("INDETERMINATE");
    long thisUpdate = revocationResult.thisUpdate;
    long nextUpdate = revocationResult.nextUpdate;
    String revocation = revocationResult.status;
    if ("REVOKED".equals(revocation))
      return report("INVALID", "VALID", "VALID", certificateAssessment.aggregate(), certificateAssessment,
          "DIAG-XADES-REVOKED", "REVOKED", thisUpdate, nextUpdate);
    String certificate = certificateAssessment.aggregate();
    String diagnostic = "NONE";
    if ("INVALID".equals(certificate)) diagnostic = "DIAG-XADES-CERTIFICATE-POLICY";
    else if (!"VALID".equals(certificate)) diagnostic = "DIAG-XADES-CERTIFICATE-INDETERMINATE";
    if (!"VALID".equals(revocation) && "NONE".equals(diagnostic)) diagnostic = "DIAG-XADES-REVOCATION";
    String status = "INVALID".equals(certificate) || "REVOKED".equals(revocation)
        ? "INVALID"
        : "VALID".equals(certificate) && "VALID".equals(revocation) ? "VERIFIED" : "INDETERMINATE";
    return report(status, "VALID", "VALID", certificate, certificateAssessment, diagnostic,
        revocation, thisUpdate, nextUpdate);
  }

  private static RevocationResult validateRevocation(X509Certificate leaf, List<X509Certificate> embedded, Request r) {
    if (r.crls.isEmpty() && r.ocsps.isEmpty()) return new RevocationResult("ABSENT", 0, 0);
    try {
      X509Certificate issuer = issuerFor(leaf, embedded, r.chain, r.anchors);
      if (issuer == null) return new RevocationResult("UNKNOWN", 0, 0);
      CertificateToken certificate = new CertificateToken(leaf);
      CertificateToken issuerToken = new CertificateToken(issuer);
      List<CertificateToken> chain = new ArrayList<>();
      for (X509Certificate cert : embedded) chain.add(new CertificateToken(cert));
      for (byte[] cert : r.chain) chain.add(new CertificateToken(certificate(cert)));
      for (byte[] cert : r.anchors) chain.add(new CertificateToken(certificate(cert)));
      RevocationDataVerifier verifier = RevocationDataVerifier.createDefaultRevocationDataVerifier();
      verifier.setSignatureMaximumRevocationFreshness(Math.multiplyExact((long) r.maximumAge, 1000L));
      verifier.setCheckRevocationFreshnessNextUpdate(true);
      boolean freshGood = false;
      boolean stale = false;
      long latestThisUpdate = 0, earliestNextUpdate = Long.MAX_VALUE;
      if (!r.crls.isEmpty()) {
        ExternalResourcesCRLSource source = new ExternalResourcesCRLSource(r.crls.stream().map(java.io.ByteArrayInputStream::new).toArray(java.io.InputStream[]::new));
        for (RevocationToken<?> revocationEvidence : source.getRevocationTokens(certificate, issuerToken)) {
          long[] dates = inspectToken(revocationEvidence, verifier, certificate, issuerToken, chain, r.validationTime, r.maximumAge);
          latestThisUpdate = Math.max(latestThisUpdate, dates[0]);
          earliestNextUpdate = Math.min(earliestNextUpdate, dates[1]);
          if (dates[2] == 2) return new RevocationResult("REVOKED", latestThisUpdate, finiteNext(earliestNextUpdate));
          if (dates[2] == 1) freshGood = true;
          if (dates[2] == -1) stale = true;
        }
      }
      if (!r.ocsps.isEmpty()) {
        ExternalResourcesOCSPSource source = new ExternalResourcesOCSPSource(r.ocsps.stream().map(java.io.ByteArrayInputStream::new).toArray(java.io.InputStream[]::new));
        for (RevocationToken<?> revocationEvidence : source.getRevocationTokens(certificate, issuerToken)) {
          long[] dates = inspectToken(revocationEvidence, verifier, certificate, issuerToken, chain, r.validationTime, r.maximumAge);
          latestThisUpdate = Math.max(latestThisUpdate, dates[0]);
          earliestNextUpdate = Math.min(earliestNextUpdate, dates[1]);
          if (dates[2] == 2) return new RevocationResult("REVOKED", latestThisUpdate, finiteNext(earliestNextUpdate));
          if (dates[2] == 1) freshGood = true;
          if (dates[2] == -1) stale = true;
        }
      }
      String result = freshGood ? "VALID" : stale ? "STALE" : "UNKNOWN";
      return new RevocationResult(result, latestThisUpdate, finiteNext(earliestNextUpdate));
    } catch (Exception malformedOrUnsupported) {
      return new RevocationResult("UNKNOWN", 0, 0);
    }
  }

  private static long[] inspectToken(RevocationToken<?> revocationEvidence, RevocationDataVerifier verifier,
      CertificateToken certificate, CertificateToken issuer, List<CertificateToken> chain,
      long validationTime, int maximumAgeSeconds) {
    long thisUpdate = revocationEvidence.getThisUpdate() == null ? 0 : revocationEvidence.getThisUpdate().getTime();
    long nextUpdate = revocationEvidence.getNextUpdate() == null ? 0 : revocationEvidence.getNextUpdate().getTime();
    boolean acceptable = verifier.isAcceptable(revocationEvidence, certificate, chain, new Date(validationTime))
        && authorizedRevocationToken(revocationEvidence, issuer.getCertificate(), validationTime);
    boolean fresh = thisUpdate > 0 && nextUpdate > 0 && thisUpdate <= validationTime
        && nextUpdate >= validationTime
        && validationTime - thisUpdate <= Math.multiplyExact((long) maximumAgeSeconds, 1_000L);
    CertificateStatus status = revocationEvidence.getStatus();
    if (status == CertificateStatus.REVOKED && acceptable)
      return new long[] { thisUpdate, nextUpdate, 2 };
    if (status == CertificateStatus.GOOD && acceptable && fresh)
      return new long[] { thisUpdate, nextUpdate, 1 };
    return new long[] { thisUpdate, nextUpdate, fresh ? 0 : -1 };
  }

  private static boolean authorizedRevocationToken(RevocationToken<?> revocationEvidence, X509Certificate issuer,
      long validationTime) {
    try {
      if (revocationEvidence instanceof CRLToken) {
        X509CRL crl = (X509CRL) CertificateFactory.getInstance("X.509")
            .generateCRL(new java.io.ByteArrayInputStream(revocationEvidence.getEncoded()));
        if (!issuer.getSubjectX500Principal().equals(crl.getIssuerX500Principal())) return false;
        crl.verify(issuer.getPublicKey());
        return true;
      }
      if (!(revocationEvidence instanceof OCSPToken ocsp)) return false;
      BasicOCSPResp response = ocsp.getBasicOCSPResp();
      if (ocsp.isSignedBy(issuer.getPublicKey())) return true;
      DigestCalculatorProvider digests = new JcaDigestCalculatorProviderBuilder().setProvider("BC").build();
      JcaX509CertificateConverter converter = new JcaX509CertificateConverter().setProvider("BC");
      for (X509CertificateHolder holder : response.getCerts()) {
        RespID byName = new RespID(holder.getSubject());
        RespID byKey = new RespID(holder.getSubjectPublicKeyInfo(), digests.get(CertificateID.HASH_SHA1));
        if (!response.getResponderId().equals(byName) && !response.getResponderId().equals(byKey)) continue;
        X509Certificate responder = converter.getCertificate(holder);
        if (!issuer.getSubjectX500Principal().equals(responder.getIssuerX500Principal())) continue;
        responder.checkValidity(new Date(validationTime));
        responder.verify(issuer.getPublicKey());
        boolean[] keyUsage = responder.getKeyUsage();
        if (keyUsage != null && (keyUsage.length == 0 || !keyUsage[0])) continue;
        List<String> extendedKeyUsage = responder.getExtendedKeyUsage();
        if (extendedKeyUsage == null || !extendedKeyUsage.contains("1.3.6.1.5.5.7.3.9")) continue;
        if (response.isSignatureValid(new JcaContentVerifierProviderBuilder()
            .setProvider("BC").build(responder.getPublicKey()))) return true;
      }
      return false;
    } catch (Exception invalidOrUnauthorized) { return false; }
  }

  private static long finiteNext(long nextUpdate) { return nextUpdate == Long.MAX_VALUE ? 0 : nextUpdate; }
  private record RevocationResult(String status, long thisUpdate, long nextUpdate) {}

  private static boolean validateWithDss(Request r) {
    try {
      CommonCertificateVerifier verifier = new CommonCertificateVerifier(true);
      CommonTrustedCertificateSource trust = new CommonTrustedCertificateSource();
      for (byte[] b : r.anchors) trust.addCertificate(new CertificateToken(certificate(b)));
      CommonCertificateSource adjunct = new CommonCertificateSource();
      for (byte[] b : r.chain) adjunct.addCertificate(new CertificateToken(certificate(b)));
      verifier.setTrustedCertSources(trust);
      verifier.setAdjunctCertSources(adjunct);
      verifier.setAIASource(null);
      verifier.setRevocationFallback(false);
      if (!r.crls.isEmpty()) verifier.setCrlSource(new ExternalResourcesCRLSource(r.crls.stream().map(java.io.ByteArrayInputStream::new).toArray(java.io.InputStream[]::new)));
      if (!r.ocsps.isEmpty()) verifier.setOcspSource(new ExternalResourcesOCSPSource(r.ocsps.stream().map(java.io.ByteArrayInputStream::new).toArray(java.io.InputStream[]::new)));
      RevocationDataVerifier freshness = RevocationDataVerifier.createDefaultRevocationDataVerifier();
      freshness.setSignatureMaximumRevocationFreshness(Math.multiplyExact((long) r.maximumAge, 1000L));
      freshness.setCheckRevocationFreshnessNextUpdate(true);
      verifier.setRevocationDataVerifier(freshness);
      SignedDocumentValidator validator = SignedDocumentValidator.fromDocument(new InMemoryDocument(r.artifact, "signed.xml"));
      validator.setCertificateVerifier(verifier);
      validator.setValidationTime(new Date(r.validationTime));
      var report = validator.validateDocument().getSimpleReport();
      return report.getSignatureIdList().size() == 1 && report.isValid(report.getSignatureIdList().get(0));
    } catch (Exception exception) {
      return false;
    }
  }

  private static Response report(String kind, String profile, String crypto, String certificate, String diagnostic,
      String revocation, long thisUpdate, long nextUpdate) {
    return report(kind, profile, crypto, certificate,
        new CertificateAssessment("NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED",
            "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED", "NOT_EVALUATED"),
        diagnostic, revocation, thisUpdate, nextUpdate);
  }

  private static Response report(String kind, String profile, String crypto, String certificate,
      CertificateAssessment assessment, String diagnostic, String revocation, long thisUpdate, long nextUpdate) {
    String body = String.join("\t", profile, crypto, certificate, assessment.chain, assessment.trust,
        assessment.time, assessment.usage, assessment.extendedKeyUsage, assessment.identity,
        assessment.authorization, assessment.algorithm,
        revocation, diagnostic,
        Long.toString(Math.max(0, thisUpdate)), Long.toString(Math.max(0, nextUpdate)));
    return new Response(kind, "NONE", body.getBytes(StandardCharsets.US_ASCII));
  }

  private record CertificateAssessment(String chain, String trust, String time, String usage,
      String extendedKeyUsage, String identity, String authorization, String algorithm) {
    CertificateAssessment withTrust(String value) {
      return new CertificateAssessment(chain, value, time, usage, extendedKeyUsage, identity, authorization, algorithm);
    }
    String aggregate() {
      List<String> values = List.of(chain, trust, time, usage, extendedKeyUsage, identity, algorithm);
      if (values.contains("INVALID")) return "INVALID";
      return values.stream().allMatch("VALID"::equals) ? "VALID" : "INDETERMINATE";
    }
  }

  private static Document parseXml(byte[] bytes) throws Exception {
    if (bytes.length == 0 || bytes.length > 8_388_608) throw new LimitException();
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setNamespaceAware(true);
    factory.setXIncludeAware(false);
    factory.setExpandEntityReferences(false);
    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
    factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
    factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
    factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
    factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
    factory.setAttribute("http://www.oracle.com/xml/jaxp/properties/maxElementDepth", "64");
    Document result;
    try {
      result = factory.newDocumentBuilder().parse(new java.io.ByteArrayInputStream(bytes));
    } catch (SAXParseException exception) {
      if (exception.getMessage() != null && exception.getMessage().contains("JAXP00010006"))
        throw new LimitException();
      throw exception;
    }
    int nodes = 0, attributes = 0, textBytes = 0;
    java.util.ArrayDeque<NodeDepth> pending = new java.util.ArrayDeque<>();
    pending.push(new NodeDepth(result.getDocumentElement(), 1));
    while (!pending.isEmpty()) {
      NodeDepth item = pending.pop();
      if (++nodes > 100_000 || item.depth > 64) throw new LimitException();
      Element element = (Element) item.node;
      attributes += element.getAttributes().getLength();
      if (attributes > 4_096) throw new LimitException();
      for (Node child = element.getFirstChild(); child != null; child = child.getNextSibling()) {
        if (child instanceof Element nested) pending.push(new NodeDepth(nested, item.depth + 1));
        else if (child.getNodeType() == Node.TEXT_NODE || child.getNodeType() == Node.CDATA_SECTION_NODE) {
          textBytes += child.getNodeValue().getBytes(StandardCharsets.UTF_8).length;
          if (textBytes > 2_097_152) throw new LimitException();
        }
      }
    }
    return result;
  }

  private static boolean validateProfile(Document d, String target) throws Exception {
    Element root = d.getDocumentElement();
    if (!target.equals(root.getLocalName()) || !"https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd".equals(root.getNamespaceURI())) return false;
    List<Element> sigs = elementsByName(d, "http://www.w3.org/2000/09/xmldsig#", "Signature");
    if (sigs.size() != 1 || sigs.get(0).getParentNode() != root) return false;
    Element sig = sigs.get(0);
    List<Element> sigChildren = childElements(sig);
    if (sigChildren.size() != 4 || !"SignedInfo".equals(sigChildren.get(0).getLocalName())
        || !"SignatureValue".equals(sigChildren.get(1).getLocalName())
        || !"KeyInfo".equals(sigChildren.get(2).getLocalName())
        || !"Object".equals(sigChildren.get(3).getLocalName())) return false;
    Element signedInfo = child(sig, "http://www.w3.org/2000/09/xmldsig#", "SignedInfo");
    if (signedInfo == null) return false;
    Element canon = child(signedInfo, "http://www.w3.org/2000/09/xmldsig#", "CanonicalizationMethod");
    Element method = child(signedInfo, "http://www.w3.org/2000/09/xmldsig#", "SignatureMethod");
    if (canon == null || !C14N.equals(canon.getAttribute("Algorithm")) || method == null || !"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256".equals(method.getAttribute("Algorithm"))) return false;
    List<Element> refs = children(signedInfo, "http://www.w3.org/2000/09/xmldsig#", "Reference");
    List<Element> signedInfoChildren = childElements(signedInfo);
    if (signedInfoChildren.size() != 4 || !"CanonicalizationMethod".equals(signedInfoChildren.get(0).getLocalName())
        || !"SignatureMethod".equals(signedInfoChildren.get(1).getLocalName())
        || refs.size() != 2 || signedInfoChildren.get(2) != refs.get(0) || signedInfoChildren.get(3) != refs.get(1)
        || !"".equals(refs.get(0).getAttribute("URI"))) return false;
    if (!"http://www.w3.org/2001/04/xmlenc#sha256".equals(digestUri(refs.get(0)))) return false;
    List<Element> transforms0 = children(child(refs.get(0), "http://www.w3.org/2000/09/xmldsig#", "Transforms"), "http://www.w3.org/2000/09/xmldsig#", "Transform");
    if (transforms0.size() != 1 || !"http://www.w3.org/2000/09/xmldsig#enveloped-signature".equals(transforms0.get(0).getAttribute("Algorithm"))) return false;
    String signedPropsUri = refs.get(1).getAttribute("URI");
    if (!signedPropsUri.matches("#[A-Za-z_][A-Za-z0-9_.-]{0,127}") || !"http://uri.etsi.org/01903#SignedProperties".equals(refs.get(1).getAttribute("Type")) || !"http://www.w3.org/2001/04/xmlenc#sha256".equals(digestUri(refs.get(1)))) return false;
    List<Element> transforms1 = children(child(refs.get(1), "http://www.w3.org/2000/09/xmldsig#", "Transforms"), "http://www.w3.org/2000/09/xmldsig#", "Transform");
    if (transforms1.size() != 1 || !C14N.equals(transforms1.get(0).getAttribute("Algorithm"))) return false;
    Set<String> ids = new HashSet<>();
    for (Element e : elements(root)) for (String attr : List.of("Id", "ID", "id")) if (e.hasAttribute(attr) && !ids.add(e.getAttribute(attr))) return false;
    String id = signedPropsUri.substring(1);
    List<Element> props = new ArrayList<>();
    for (Element e : elements(root)) if (id.equals(e.getAttribute("Id"))) props.add(e);
    if (props.size() != 1 || !"SignedProperties".equals(props.get(0).getLocalName()) || !"http://uri.etsi.org/01903/v1.3.2#".equals(props.get(0).getNamespaceURI())) return false;
    List<Element> keyInfos = children(sig, "http://www.w3.org/2000/09/xmldsig#", "KeyInfo");
    if (keyInfos.size() != 1) return false;
    List<Element> keyInfoChildren = childElements(keyInfos.get(0));
    if (keyInfoChildren.isEmpty() || keyInfoChildren.size() > 2 || !"X509Data".equals(keyInfoChildren.get(0).getLocalName())
        || !"http://www.w3.org/2000/09/xmldsig#".equals(keyInfoChildren.get(0).getNamespaceURI())) return false;
    if (keyInfoChildren.size() == 2 && (!"KeyValue".equals(keyInfoChildren.get(1).getLocalName())
        || !"http://www.w3.org/2000/09/xmldsig#".equals(keyInfoChildren.get(1).getNamespaceURI()))) return false;
    List<Element> x509DataChildren = childElements(keyInfoChildren.get(0));
    if (x509DataChildren.isEmpty() || x509DataChildren.stream().anyMatch(e ->
        !"X509Certificate".equals(e.getLocalName()) || !"http://www.w3.org/2000/09/xmldsig#".equals(e.getNamespaceURI()))) return false;
    List<Element> signingTimes = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "SigningTime");
    List<Element> policyIds = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "SignaturePolicyIdentifier");
    if (signingTimes.size() != 1 || policyIds.size() != 1) return false;
    if (elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "SigningCertificate").size() != 1) return false;
    List<Element> identifiers = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "Identifier");
    if (identifiers.isEmpty() || !"urn:oid:2.16.724.1.3.1.1.2.1.9".equals(identifiers.get(0).getTextContent().trim())) return false;
    List<Element> policyDigests = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "SigPolicyHash");
    if (policyDigests.size() != 1) return false;
    Element policyDigestMethod = child(policyDigests.get(0), "http://www.w3.org/2000/09/xmldsig#", "DigestMethod");
    Element policyDigestValue = child(policyDigests.get(0), "http://www.w3.org/2000/09/xmldsig#", "DigestValue");
    if (policyDigestMethod == null || !"http://www.w3.org/2000/09/xmldsig#sha1".equals(policyDigestMethod.getAttribute("Algorithm"))
        || policyDigestValue == null || !Base64.getEncoder().encodeToString(POLICY_DIGEST).equals(policyDigestValue.getTextContent().trim())) return false;
    List<Element> spuris = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "SPURI");
    if (spuris.size() != 1 || !"https://sede.administracion.gob.es/politica_de_firma_anexo_1.pdf".equals(spuris.get(0).getTextContent().trim())) return false;
    List<Element> qualifying = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "QualifyingProperties");
    if (qualifying.size() != 1 || !qualifying.get(0).getAttribute("Target").startsWith("#")
        || qualifying.get(0).getParentNode() == null
        || !(qualifying.get(0).getParentNode() instanceof Element qualifyingParent)
        || !"Object".equals(qualifyingParent.getLocalName())
        || !"http://www.w3.org/2000/09/xmldsig#".equals(qualifyingParent.getNamespaceURI())) return false;
    if (!qualifying.get(0).getAttribute("Target").substring(1).equals(sig.getAttribute("Id"))) return false;
    List<Element> qualifyingChildren = childElements(qualifying.get(0));
    if (qualifyingChildren.size() != 1 || qualifyingChildren.get(0) != props.get(0)) return false;
    List<Element> objects = children(sig, "http://www.w3.org/2000/09/xmldsig#", "Object");
    if (objects.size() != 1 || childElements(objects.get(0)).size() != 1 || childElements(objects.get(0)).get(0) != qualifying.get(0)) return false;
    List<Element> propertiesChildren = childElements(props.get(0));
    if (propertiesChildren.size() != 2 || !"SignedSignatureProperties".equals(propertiesChildren.get(0).getLocalName())
        || !"SignedDataObjectProperties".equals(propertiesChildren.get(1).getLocalName())) return false;
    if (!elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "UnsignedProperties").isEmpty()) return false;
    List<Element> signingCertificateChildren = elementsByName(d, "http://uri.etsi.org/01903/v1.3.2#", "SigningCertificate");
    List<Element> certDigestMethods = elementsByName(signingCertificateChildren.get(0), "http://www.w3.org/2000/09/xmldsig#", "DigestMethod");
    List<Element> certDigestValues = elementsByName(signingCertificateChildren.get(0), "http://www.w3.org/2000/09/xmldsig#", "DigestValue");
    if (certDigestMethods.isEmpty() || certDigestValues.isEmpty() || !"http://www.w3.org/2000/09/xmldsig#sha1".equals(certDigestMethods.get(0).getAttribute("Algorithm"))) return false;
    List<X509Certificate> embedded = certificates(sig);
    if (embedded.isEmpty()) return false;
    byte[] certificateDigest = MessageDigest.getInstance("SHA-1").digest(embedded.get(0).getEncoded());
    if (!MessageDigest.isEqual(certificateDigest, Base64.getMimeDecoder().decode(certDigestValues.get(0).getTextContent()))) return false;
    org.w3c.dom.Attr rootReferenceId = refs.get(0).getAttributeNode("Id");
    if (rootReferenceId == null || !rootReferenceId.getValue().matches("[A-Za-z_][A-Za-z0-9_.-]{0,127}")) return false;
    List<Element> formats = elementsByName(props.get(0), "http://uri.etsi.org/01903/v1.3.2#", "DataObjectFormat");
    if (formats.size() != 1 || !("#" + rootReferenceId.getValue()).equals(formats.get(0).getAttribute("ObjectReference"))) return false;
    return true;
  }

  private static boolean validateUnsignedTarget(Document d, String target) {
    Element root = d.getDocumentElement();
    if (!target.equals(root.getLocalName()) || !"https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd".equals(root.getNamespaceURI())) return false;
    if (!elementsByName(d, "http://www.w3.org/2000/09/xmldsig#", "Signature").isEmpty()) return false;
    Set<String> ids = new HashSet<>();
    for (Element element : elements(root)) for (String attr : List.of("Id", "ID", "id")) {
      if (element.hasAttribute(attr) && !ids.add(element.getAttribute(attr))) return false;
    }
    return true;
  }


  private static String digestUri(Element reference) {
    Element digest = child(reference, "http://www.w3.org/2000/09/xmldsig#", "DigestMethod");
    return digest == null ? "" : digest.getAttribute("Algorithm");
  }
  private static Element directSignature(Element root) { for (Element e : children(root, "http://www.w3.org/2000/09/xmldsig#", "Signature")) return e; return null; }
  private static Element child(Element p, String ns, String name) { if (p == null) return null; for (Element e : childElements(p)) if (ns.equals(e.getNamespaceURI()) && name.equals(e.getLocalName())) return e; return null; }
  private static List<Element> children(Element p, String ns, String name) { if (p == null) return List.of(); List<Element> out = new ArrayList<>(); for (Element e : childElements(p)) if (ns.equals(e.getNamespaceURI()) && name.equals(e.getLocalName())) out.add(e); return out; }
  private static List<Element> childElements(Element parent) { List<Element> out = new ArrayList<>(); for (Node n = parent.getFirstChild(); n != null; n = n.getNextSibling()) if (n instanceof Element e) out.add(e); return out; }
  private static List<Element> elements(Element parent) {
    List<Element> out = new ArrayList<>();
    java.util.ArrayDeque<Element> pending = new java.util.ArrayDeque<>();
    pending.push(parent);
    while (!pending.isEmpty()) {
      Element current = pending.pop(); out.add(current);
      List<Element> children = childElements(current);
      for (int i = children.size() - 1; i >= 0; i--) pending.push(children.get(i));
    }
    return out;
  }
  private static List<Element> elementsByName(Document doc, String ns, String local) { return elementsByName(doc.getDocumentElement(), ns, local); }
  private static List<Element> elementsByName(Element root, String ns, String local) { List<Element> out = new ArrayList<>(); for (Element e : elements(root)) if (ns.equals(e.getNamespaceURI()) && local.equals(e.getLocalName())) out.add(e); return out; }
  private static List<X509Certificate> certificates(Element sig) throws Exception { List<X509Certificate> out = new ArrayList<>(); NodeList nodes = sig.getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "X509Certificate"); for (int i=0;i<nodes.getLength();i++) out.add(certificate(Base64.getMimeDecoder().decode(nodes.item(i).getTextContent()))); return out; }

  private static boolean keyValueMatches(Element sig, X509Certificate cert) {
    List<Element> keyValues = elementsByName(sig, "http://www.w3.org/2000/09/xmldsig#", "KeyValue");
    if (keyValues.isEmpty()) return true;
    if (keyValues.size() != 1 || !(cert.getPublicKey() instanceof java.security.interfaces.RSAPublicKey rsa)) return false;
    List<Element> rsaValues = children(keyValues.get(0), "http://www.w3.org/2000/09/xmldsig#", "RSAKeyValue");
    if (rsaValues.size() != 1) return false;
    List<Element> children = childElements(rsaValues.get(0));
    if (children.size() != 2 || !"Modulus".equals(children.get(0).getLocalName()) || !"Exponent".equals(children.get(1).getLocalName())) return false;
    try {
      byte[] modulus = Base64.getMimeDecoder().decode(children.get(0).getTextContent());
      byte[] exponent = Base64.getMimeDecoder().decode(children.get(1).getTextContent());
      return new java.math.BigInteger(1, modulus).equals(rsa.getModulus())
          && new java.math.BigInteger(1, exponent).equals(rsa.getPublicExponent());
    } catch (Exception malformed) { return false; }
  }

  private static X509Certificate issuerFor(X509Certificate leaf, List<X509Certificate> embedded, List<byte[]> chain, List<byte[]> anchors) throws Exception {
    List<X509Certificate> all = new ArrayList<>(embedded); for (byte[] b : chain) all.add(certificate(b)); for (byte[] b : anchors) all.add(certificate(b));
    Map<String, X509Certificate> issuers = new HashMap<>();
    for (X509Certificate c : all) if (leaf.getIssuerX500Principal().equals(c.getSubjectX500Principal()))
      issuers.put(Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(c.getEncoded())), c);
    return issuers.size() == 1 ? issuers.values().iterator().next() : null;
  }

  private static CertificateAssessment assessCertificate(X509Certificate leaf, List<X509Certificate> embedded,
      Request r) {
    String chain = validateChainLinks(leaf, embedded, r);
    String trust = validatePath(leaf, embedded, r);
    String time = validateTime(leaf, embedded, r);
    boolean[] keyUsage = leaf.getKeyUsage();
    String usage = keyUsage != null && keyUsage.length > 0 && keyUsage[0] ? "VALID" : "INVALID";
    String extendedKeyUsage;
    try {
      // No accepted signer EKU allowlist is established by the selected edition yet.
      // An absent restriction is usable; an explicit purpose cannot be promoted.
      extendedKeyUsage = leaf.getExtendedKeyUsage() == null ? "VALID" : "INDETERMINATE";
    } catch (Exception malformedExtendedKeyUsage) {
      extendedKeyUsage = "INDETERMINATE";
    }
    String identity = r.fingerprint.isEmpty() ? "INDETERMINATE" : "VALID";
    String algorithm = leaf.getPublicKey() instanceof java.security.interfaces.RSAKey rsa
        && rsa.getModulus().bitLength() >= 1024 ? "VALID" : "INVALID";
    // Acting-party authorization needs host delegation/context evidence, which this protocol does not accept.
    return new CertificateAssessment(chain, trust, time, usage, extendedKeyUsage, identity, "INDETERMINATE", algorithm);
  }

  private static String validateTime(X509Certificate leaf, List<X509Certificate> embedded, Request r) {
    try {
      Date at = new Date(r.validationTime);
      List<X509Certificate> path = new ArrayList<>(embedded);
      for (byte[] der : r.chain) path.add(certificate(der));
      for (X509Certificate certificate : path) certificate.checkValidity(at);
      return "VALID";
    } catch (java.security.cert.CertificateExpiredException | java.security.cert.CertificateNotYetValidException e) {
      return "INVALID";
    } catch (Exception e) { return "INDETERMINATE"; }
  }

  private static String validateChainLinks(X509Certificate leaf, List<X509Certificate> embedded, Request r) {
    try {
      List<X509Certificate> all = new ArrayList<>(embedded);
      for (byte[] b : r.chain) all.add(certificate(b));
      for (byte[] b : r.anchors) all.add(certificate(b));
      X509Certificate current = leaf;
      Set<String> visited = new HashSet<>();
      for (int depth = 0; depth < 16; depth++) {
        String currentDigest = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(current.getEncoded()));
        if (!visited.add(currentDigest)) return "INVALID";
        for (byte[] anchor : r.anchors)
          if (MessageDigest.isEqual(certificate(anchor).getEncoded(), current.getEncoded())) return "VALID";
        List<X509Certificate> issuers = new ArrayList<>();
        for (X509Certificate candidate : all) {
          if (current.getIssuerX500Principal().equals(candidate.getSubjectX500Principal())) {
            String digest = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(candidate.getEncoded()));
            boolean duplicate = false;
            for (X509Certificate existing : issuers)
              if (MessageDigest.isEqual(existing.getEncoded(), candidate.getEncoded())) duplicate = true;
            if (!digest.equals(currentDigest) && !duplicate) issuers.add(candidate);
          }
        }
        if (issuers.isEmpty()) {
          if (current.getIssuerX500Principal().equals(current.getSubjectX500Principal())) {
            current.verify(current.getPublicKey());
            return "VALID";
          }
          return "INDETERMINATE";
        }
        if (issuers.size() != 1) return "INVALID";
        current.verify(issuers.get(0).getPublicKey());
        current = issuers.get(0);
      }
      return "INDETERMINATE";
    } catch (Exception e) { return "INVALID"; }
  }

  private static String validatePath(X509Certificate leaf, List<X509Certificate> embedded, Request r) {
    try {
      Date at = new Date(r.validationTime);
      Set<TrustAnchor> anchors = new HashSet<>(); for (byte[] b : r.anchors) anchors.add(new TrustAnchor(certificate(b), null));
      if (anchors.isEmpty()) return "INDETERMINATE";
      List<X509Certificate> pathCerts = new ArrayList<>(embedded); for (byte[] b : r.chain) pathCerts.add(certificate(b));
      pathCerts.removeIf(c -> anchors.stream().anyMatch(a -> c.equals(a.getTrustedCert())));
      X509CertSelector selector = new X509CertSelector(); selector.setCertificate(leaf);
      PKIXBuilderParameters params = new PKIXBuilderParameters(anchors, selector); params.setDate(at); params.setRevocationEnabled(false);
      params.addCertStore(CertStore.getInstance("Collection", new CollectionCertStoreParameters(pathCerts)));
      CertPathBuilder.getInstance("PKIX").build(params);
      return "VALID";
    } catch (Exception e) { return "INDETERMINATE"; }
  }

  private static final class FixedCertificateKeySelector extends KeySelector {
    private final X509Certificate certificate;
    FixedCertificateKeySelector(X509Certificate certificate) { this.certificate = certificate; }
    @Override public KeySelectorResult select(KeyInfo keyInfo, Purpose purpose, javax.xml.crypto.AlgorithmMethod method, XMLCryptoContext context) throws KeySelectorException {
      return () -> certificate.getPublicKey();
    }
  }

  private static XAdESSignatureParameters parameters(Request r) throws Exception {
    X509Certificate leaf = certificate(r.signerCertificate);
    leaf.checkValidity(new Date(r.signingTime));
    if (!(leaf.getPublicKey() instanceof java.security.interfaces.RSAKey rsa) || rsa.getModulus().bitLength() < 1024)
      throw new IllegalArgumentException("RSA key policy");
    boolean[] usage = leaf.getKeyUsage();
    if (usage == null || usage.length == 0 || !usage[0]) throw new IllegalArgumentException("key usage");
    CertificateToken token = new CertificateToken(leaf);
    List<CertificateToken> chain = new ArrayList<>();
    chain.add(token);
    for (byte[] der : r.chain) chain.add(new CertificateToken(certificate(der)));
    XAdESSignatureParameters p = new XAdESSignatureParameters();
    p.setSigningCertificate(token);
    p.setCertificateChain(chain);
    p.setSignatureLevel(SignatureLevel.XAdES_BASELINE_B);
    p.setEn319132(false);
    p.setSignaturePackaging(SignaturePackaging.ENVELOPED);
    p.setDigestAlgorithm(DigestAlgorithm.SHA256);
    p.setReferenceDigestAlgorithm(DigestAlgorithm.SHA256);
    p.setSigningCertificateDigestMethod(DigestAlgorithm.SHA1);
    p.setSignedInfoCanonicalizationMethod(C14N);
    p.setSignedPropertiesCanonicalizationMethod(C14N);
    p.setPrettyPrint(false);
    p.getContext().setDeterministicId("VF" + hex(MessageDigest.getInstance("SHA-256").digest(r.artifact)));
    p.bLevel().setSigningDate(new Date(r.signingTime));
    Policy policy = new Policy();
    policy.setId("urn:oid:2.16.724.1.3.1.1.2.1.9");
    policy.setSpuri("https://sede.administracion.gob.es/politica_de_firma_anexo_1.pdf");
    policy.setDigestAlgorithm(DigestAlgorithm.SHA1);
    policy.setDigestValue(POLICY_DIGEST);
    p.bLevel().setSignaturePolicy(policy);
    DSSReference reference = new DSSReference();
    reference.setId("ref-root");
    reference.setUri("");
    reference.setDigestMethodAlgorithm(DigestAlgorithm.SHA256);
    reference.setTransforms(List.of(new EnvelopedSignatureTransform()));
    reference.setContents(new InMemoryDocument(r.artifact, "artifact.xml"));
    p.setReferences(List.of(reference));
    DSSDataObjectFormat format = new DSSDataObjectFormat();
    format.setObjectReference("#ref-root");
    format.setMimeType("text/xml");
    format.setEncoding("UTF-8");
    p.setDataObjectFormatList(List.of(format));
    return p;
  }

  private static X509Certificate certificate(byte[] der) throws Exception {
    return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new java.io.ByteArrayInputStream(der));
  }

  private static String hex(byte[] bytes) {
    StringBuilder value = new StringBuilder(bytes.length * 2);
    for (byte item : bytes) value.append(String.format("%02x", item & 0xff));
    return value.toString();
  }

  private static final class Request {
    final String protocol, command, edition, profile, target, digest, fingerprint;
    final long signingTime, validationTime;
    final int maximumAge;
    final byte[] artifact, signerCertificate, signature;
    final List<byte[]> chain, anchors, crls, ocsps;

    Request(InputStream input) throws Exception {
      List<byte[]> f = new ArrayList<>();
      long total = 0;
      while (true) {
        byte[] line = readLine(input);
        if (line == null) break;
        total += line.length;
        if (total > MAX_REQUEST) throw new LimitException();
        f.add(line.length == 0 ? new byte[0] : Base64.getDecoder().decode(line));
        if (f.size() > 128) throw new LimitException();
      }
      Cursor c = new Cursor(f);
      protocol = c.string(); command = c.string(); edition = c.string(); profile = c.string();
      target = c.string(); digest = c.string(); signingTime = c.number(); validationTime = c.number();
      maximumAge = (int) c.number(); fingerprint = c.string(); artifact = c.bytes(); signerCertificate = c.bytes();
      chain = c.list(); signature = c.bytes(); anchors = c.list(); crls = c.list(); ocsps = c.list();
      if (!c.done()) throw new IllegalArgumentException("trailing fields");
    }

    static Request read(InputStream input) throws Exception { return new Request(input); }
    private static byte[] readLine(InputStream in) throws Exception {
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      int b;
      while ((b = in.read()) != -1 && b != '\n') {
        if (out.size() >= MAX_LINE) throw new LimitException();
        out.write(b);
      }
      if (b == -1 && out.size() == 0) return null;
      return out.toByteArray();
    }
  }

  private static final class Cursor {
    private final List<byte[]> values; private int index;
    Cursor(List<byte[]> values) { this.values = values; }
    byte[] bytes() { if (index >= values.size()) throw new IllegalArgumentException("short request"); return values.get(index++); }
    String string() { return new String(bytes(), StandardCharsets.UTF_8); }
    long number() { return Long.parseLong(string()); }
    List<byte[]> list() { int count = Math.toIntExact(number()); if (count < 0 || count > 32) throw new IllegalArgumentException("bad list"); List<byte[]> out = new ArrayList<>(); for (int i=0;i<count;i++) out.add(bytes()); return out; }
    boolean done() { return index == values.size(); }
  }

  private record Response(String kind, String diagnostic, byte[] payload) {
    void write(java.io.OutputStream out) {
      try {
        String encoded = Base64.getEncoder().encodeToString(payload);
        out.write(("VERIFACTU-DSS-1\n" + kind + "\n" + diagnostic + "\n" + encoded + "\n").getBytes(StandardCharsets.US_ASCII));
        out.flush();
      } catch (Exception ignored) { }
    }
  }
  private static final class LimitException extends RuntimeException {}
  private record NodeDepth(Node node, int depth) {}
}
