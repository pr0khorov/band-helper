package com.bandinfo.setlist;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/setlists")
public class SetlistController {

    private final SetlistRepository repo;

    public SetlistController(SetlistRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Setlist> list() {
        return repo.findAll(org.springframework.data.domain.Sort.by("name").ascending());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Setlist> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Setlist create(@RequestBody Setlist s) {
        s.setId(null);
        return repo.save(s);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Setlist> update(@PathVariable Long id, @RequestBody Setlist s) {
        return repo.findById(id).map(existing -> {
            existing.setName(s.getName());
            existing.setBody(s.getBody());
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
