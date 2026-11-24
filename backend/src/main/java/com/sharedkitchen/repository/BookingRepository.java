package com.sharedkitchen.repository;

import com.sharedkitchen.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUsername(String username);
    List<Booking> findByKitchenId(Long kitchenId);
    List<Booking> findByStatus(String status);
    List<Booking> findByUsernameAndStatus(String username, String status);
}
