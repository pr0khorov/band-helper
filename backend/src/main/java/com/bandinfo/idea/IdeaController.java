package com.bandinfo.idea;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ideas")
public class IdeaController {

    private final IdeaRepository repo;

    public IdeaController(IdeaRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Idea> list() {
        return repo.findAll(org.springframework.data.domain.Sort.by("name").ascending());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Idea> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Idea create(@RequestBody Idea i) {
        i.setId(null);
        return repo.save(i);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Idea> update(@PathVariable Long id, @RequestBody Idea i) {
        return repo.findById(id).map(existing -> {
            existing.setName(i.getName());
            existing.setBody(i.getBody());
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
