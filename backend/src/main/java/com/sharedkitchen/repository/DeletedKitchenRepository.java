package com.sharedkitchen.repository;

import com.sharedkitchen.entity.DeletedKitchen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeletedKitchenRepository extends JpaRepository<DeletedKitchen, Long> {
    List<DeletedKitchen> findByProviderUsername(String providerUsername);
}
