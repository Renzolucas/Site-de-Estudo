package com.studyos.api.service.auth;

import com.studyos.api.dto.auth.request.ForgotPasswordRequest;
import com.studyos.api.dto.auth.request.ResetPasswordRequest;
import com.studyos.api.dto.auth.request.VerifyResetCodeRequest;
import com.studyos.api.dto.auth.response.ForgotPasswordResponse;
import com.studyos.api.dto.auth.response.ResetPasswordResponse;
import com.studyos.api.dto.auth.response.VerifyResetCodeResponse;
import com.studyos.api.exception.custom.BusinessRuleException;
import com.studyos.api.model.PasswordResetToken;
import com.studyos.api.model.User;
import com.studyos.api.repository.auth.PasswordResetTokenRepository;
import com.studyos.api.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${studyos.recovery.demo-mode:false}")
    private boolean demoMode;

    private static final String GENERIC_FORGOT_MESSAGE =
            "Se o e-mail estiver cadastrado, um código de verificação foi enviado.";

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        try {
            if (request == null || request.email() == null || request.email().isBlank()) {
                return ForgotPasswordResponse.of(GENERIC_FORGOT_MESSAGE);
            }

            String cleanEmail = request.email().trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmail(cleanEmail);

            if (userOpt.isEmpty()) {
                log.info("[RECUPERAÇÃO DE SENHA - MODO SIMULADO] Solicitação para e-mail não cadastrado: {}. Resposta genérica retornada.", cleanEmail);
                return ForgotPasswordResponse.of(GENERIC_FORGOT_MESSAGE);
            }

            User user = userOpt.get();

            // Invalida atômica e transactionalmente códigos anteriores não utilizados para o mesmo e-mail
            passwordResetTokenRepository.invalidatePreviousTokensByEmail(cleanEmail);

            // Gera código de 6 dígitos criptograficamente seguro (000000 - 999999)
            int pin = secureRandom.nextInt(1_000_000);
            String code = String.format("%06d", pin);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .email(cleanEmail)
                    .user(user)
                    .code(code)
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .attempts(0)
                    .used(false)
                    .build();

            passwordResetTokenRepository.save(resetToken);

            log.info("[RECUPERAÇÃO DE SENHA - MODO SIMULADO/ACADÊMICO] E-mail: {} | Código gerado: {}. Válido por 10 minutos. Nenhum e-mail real foi enviado.", cleanEmail, code);

            if (demoMode) {
                return ForgotPasswordResponse.of(GENERIC_FORGOT_MESSAGE, code);
            }

            return ForgotPasswordResponse.of(GENERIC_FORGOT_MESSAGE);
        } catch (Exception e) {
            log.error("[RECUPERAÇÃO DE SENHA] Erro ao processar solicitação de recuperação para {}: ", request != null ? request.email() : "null", e);
            // Garante resposta 200 genérica e segura em qualquer circunstância inesperada
            return ForgotPasswordResponse.of(GENERIC_FORGOT_MESSAGE);
        }
    }

    @Transactional
    public VerifyResetCodeResponse verifyResetCode(VerifyResetCodeRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        String cleanCode = request.code().trim();

        PasswordResetToken token = passwordResetTokenRepository
                .findTopByEmailOrderByCreatedAtDesc(cleanEmail)
                .orElseThrow(() -> new BusinessRuleException("Código inválido ou não encontrado. Solicite um novo código."));

        if (Boolean.TRUE.equals(token.getUsed())) {
            throw new BusinessRuleException("Este código já foi utilizado. Solicite um novo código.");
        }

        if (token.getAttempts() >= 5) {
            token.setUsed(true);
            passwordResetTokenRepository.save(token);
            throw new BusinessRuleException("Número máximo de tentativas excedido. O código foi invalidado. Solicite um novo código.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("Código expirado. O código tem validade de 10 minutos. Solicite um novo código.");
        }

        if (!token.getCode().equals(cleanCode)) {
            int newAttempts = token.getAttempts() + 1;
            token.setAttempts(newAttempts);
            if (newAttempts >= 5) {
                token.setUsed(true);
            }
            passwordResetTokenRepository.save(token);

            if (newAttempts >= 5) {
                throw new BusinessRuleException("Número máximo de tentativas excedido. O código foi invalidado. Solicite um novo código.");
            }
            int remaining = 5 - newAttempts;
            throw new BusinessRuleException("Código incorreto. Você tem mais " + remaining + " tentativa(s).");
        }

        return new VerifyResetCodeResponse("Código verificado com sucesso.", true);
    }

    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        String cleanCode = request.code().trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BusinessRuleException("Usuário não encontrado."));

        PasswordResetToken token = passwordResetTokenRepository
                .findTopByEmailOrderByCreatedAtDesc(cleanEmail)
                .orElseThrow(() -> new BusinessRuleException("Código inválido ou não encontrado. Solicite um novo código."));

        if (Boolean.TRUE.equals(token.getUsed())) {
            throw new BusinessRuleException("Este código já foi utilizado. Solicite um novo código.");
        }

        if (token.getAttempts() >= 5) {
            token.setUsed(true);
            passwordResetTokenRepository.save(token);
            throw new BusinessRuleException("Número máximo de tentativas excedido. O código foi invalidado. Solicite um novo código.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("Código expirado. Solicite um novo código.");
        }

        if (!token.getCode().equals(cleanCode)) {
            int newAttempts = token.getAttempts() + 1;
            token.setAttempts(newAttempts);
            if (newAttempts >= 5) {
                token.setUsed(true);
            }
            passwordResetTokenRepository.save(token);

            if (newAttempts >= 5) {
                throw new BusinessRuleException("Número máximo de tentativas excedido. O código foi invalidado. Solicite um novo código.");
            }
            int remaining = 5 - newAttempts;
            throw new BusinessRuleException("Código incorreto. Você tem mais " + remaining + " tentativa(s).");
        }

        // Atualiza a senha no mesmo formato usado pelo cadastro
        user.setPassword(request.newPassword());
        userRepository.save(user);

        // Invalida o código após uso único
        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        log.info("[RECUPERAÇÃO DE SENHA] Senha redefinida com sucesso para o usuário: {}", cleanEmail);

        return new ResetPasswordResponse("Senha redefinida com sucesso!");
    }
}
