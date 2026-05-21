package com.bandinfo.rehearsal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RehearsalRepository extends JpaRepository<Rehearsal, Long> {
    List<Rehearsal> findByDateBetweenOrderByDateAscStartTimeAsc(LocalDate from, LocalDate to);
    List<Rehearsal> findAllByOrderByDateAscStartTimeAsc();
}
