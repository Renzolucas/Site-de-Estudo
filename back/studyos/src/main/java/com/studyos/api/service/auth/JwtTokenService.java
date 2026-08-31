package com.studyos.api.service.auth;

import com.studyos.api.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
public class JwtTokenService {

    @Value("${studyos.jwt.secret:StudyOS_Super_Secret_Jwt_Signing_Key_2026_High_Security_Token}")
    private String jwtSecret;

    @Value("${studyos.jwt.expiration-days:7}")
    private int expirationDays;

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Gera um token JWT padrão (RFC 7519) assinado com HMAC-SHA256.
     */
    public String generateToken(User user) {
        try {
            long nowSeconds = Instant.now().getEpochSecond();
            long expSeconds = Instant.now().plus(expirationDays, ChronoUnit.DAYS).getEpochSecond();

            // Header Base64Url
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String encodedHeader = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));

            // Payload Base64Url
            String sanitizedName = user.getName() != null ? user.getName().replace("\"", "\\\"") : "";
            String sanitizedEmail = user.getEmail() != null ? user.getEmail().replace("\"", "\\\"") : "";
            String payloadJson = String.format(
                    "{\"sub\":\"%s\",\"id\":%d,\"name\":\"%s\",\"iat\":%d,\"exp\":%d}",
                    sanitizedEmail, user.getId(), sanitizedName, nowSeconds, expSeconds
            );
            String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            // Assinatura
            String dataToSign = encodedHeader + "." + encodedPayload;
            String signature = sign(dataToSign, jwtSecret);

            return dataToSign + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar token JWT", e);
        }
    }

    /**
     * Valida um token JWT e verifica expiração e integridade da assinatura.
     */
    public boolean validateToken(String token) {
        try {
            if (token == null || token.isBlank()) return false;
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;

            String encodedHeader = parts[0];
            String encodedPayload = parts[1];
            String signature = parts[2];

            String expectedSignature = sign(encodedHeader + "." + encodedPayload, jwtSecret);
            if (!MessageDigest.isEqual(signature.getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            // Verifica expiração
            String payloadJson = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            int expIdx = payloadJson.indexOf("\"exp\":");
            if (expIdx != -1) {
                int start = expIdx + 6;
                int end = payloadJson.indexOf("}", start);
                if (end == -1) end = payloadJson.indexOf(",", start);
                if (end != -1) {
                    long exp = Long.parseLong(payloadJson.substring(start, end).trim());
                    if (Instant.now().getEpochSecond() > exp) {
                        return false; // Token expirado
                    }
                }
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extrai o e-mail (subject) de dentro do payload do token.
     */
    public String extractEmail(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            int subIdx = payloadJson.indexOf("\"sub\":\"");
            if (subIdx == -1) return null;
            int start = subIdx + 7;
            int end = payloadJson.indexOf("\"", start);
            return payloadJson.substring(start, end);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extrai o ID do usuário de dentro do payload do token.
     */
    public Long extractUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            int idIdx = payloadJson.indexOf("\"id\":");
            if (idIdx == -1) return null;
            int start = idIdx + 5;
            int end = payloadJson.indexOf(",", start);
            if (end == -1) end = payloadJson.indexOf("}", start);
            return Long.parseLong(payloadJson.substring(start, end).trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
        mac.init(secretKey);
        byte[] hmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hmac);
    }
}
