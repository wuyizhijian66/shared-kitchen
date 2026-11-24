package com.sharedkitchen.repository;

import com.sharedkitchen.entity.KitchenApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenApplicationRepository extends JpaRepository<KitchenApplication, Long> {
    List<KitchenApplication> findByProviderUsername(String username);
    List<KitchenApplication> findByStatus(String status);
}
