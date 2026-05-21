package com.bandinfo.rehearsal;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rehearsals")
public class RehearsalController {

    private final RehearsalRepository repo;

    public RehearsalController(RehearsalRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Rehearsal> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from != null && to != null) {
            return repo.findByDateBetweenOrderByDateAscStartTimeAsc(from, to);
        }
        return repo.findAllByOrderByDateAscStartTimeAsc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rehearsal> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Rehearsal create(@RequestBody Rehearsal r) {
        r.setId(null);
        return repo.save(r);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rehearsal> update(@PathVariable Long id, @RequestBody Rehearsal r) {
        return repo.findById(id).map(existing -> {
            existing.setDate(r.getDate());
            existing.setStartTime(r.getStartTime());
            existing.setEndTime(r.getEndTime());
            existing.setGoals(r.getGoals());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
