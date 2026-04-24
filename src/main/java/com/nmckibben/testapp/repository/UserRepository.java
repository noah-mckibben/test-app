package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByPhoneNumber(String phoneNumber);
    boolean existsByUsername(String username);
    List<User> findByStatus(String status);
    List<User> findByRole(String role);
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.displayName) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<User> searchByUsernameOrDisplayName(@Param("q") String query);
}
