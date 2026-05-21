package com.bandinfo.song;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private final SongRepository repo;

    public SongController(SongRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Song> list() {
        return repo.findAll(org.springframework.data.domain.Sort.by("title").ascending());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Song create(@RequestBody Song s) {
        s.setId(null);
        return repo.save(s);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Song> update(@PathVariable Long id, @RequestBody Song s) {
        return repo.findById(id).map(existing -> {
            existing.setTitle(s.getTitle());
            existing.setAuthor(s.getAuthor());
            existing.setBpm(s.getBpm());
            existing.setTonality(s.getTonality());
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
