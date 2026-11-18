package com.studyos.api.service.auth;

import com.studyos.api.exception.custom.ForbiddenException;
import com.studyos.api.exception.custom.UnauthorizedException;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

/**
 * Serviço de resolução e autorização do usuário atual a partir do token JWT.
 * O papel e status do usuário vêm SEMPRE do banco a cada requisição,
 * nunca de dados enviados pelo front-end.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Token de autorização não fornecido ou formato inválido.");
        }

        String token = authHeader.substring(7).trim();
        if (!jwtTokenService.validateToken(token)) {
            throw new UnauthorizedException("Token JWT inválido ou expirado.");
        }

        Long userId = jwtTokenService.extractUserId(token);
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        if (user == null) {
            String email = jwtTokenService.extractEmail(token);
            if (email != null) {
                user = userRepository.findByEmail(email).orElse(null);
            }
        }

        if (user == null) {
            throw new UnauthorizedException("Usuário do token não encontrado.");
        }

        // Token de usuário inativo = 401
        if (Boolean.FALSE.equals(user.getActive())) {
            log.warn("Tentativa de acesso autenticado com conta inativa: {}", user.getEmail());
            throw new UnauthorizedException("Conta de usuário inativa.");
        }

        return user;
    }

    @Transactional(readOnly = true)
    public User requireRole(String authHeader, UserRole... allowedRoles) {
        User user = getCurrentUser(authHeader);

        if (allowedRoles == null || allowedRoles.length == 0) {
            return user;
        }

        UserRole userRole = user.getRole() != null ? user.getRole() : UserRole.STUDENT;
        boolean hasRole = Arrays.asList(allowedRoles).contains(userRole);

        if (!hasRole) {
            log.warn("Acesso negado para usuário {} (papel: {}) em recurso que exige {}",
                    user.getEmail(), userRole, Arrays.toString(allowedRoles));
            throw new ForbiddenException("FORBIDDEN", "Você não tem permissão para acessar este recurso.");
        }

        return user;
    }
}
