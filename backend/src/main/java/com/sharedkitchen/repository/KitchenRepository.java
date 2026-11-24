package com.sharedkitchen.repository;

import com.sharedkitchen.entity.Kitchen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenRepository extends JpaRepository<Kitchen, Long> {
    List<Kitchen> findByStatus(String status);
    List<Kitchen> findByProviderUsername(String providerUsername);
    List<Kitchen> findByType(String type);
    List<Kitchen> findByStatusNot(String status);
    List<Kitchen> findByTypeAndStatus(String type, String status);
}
