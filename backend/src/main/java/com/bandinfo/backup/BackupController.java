package com.bandinfo.backup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private final JdbcTemplate jdbc;

    @Value("${app.backup.dir}")
    private String backupDir;

    public BackupController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/export")
    public ResponseEntity<?> export() throws IOException {
        Path dir = Paths.get(backupDir);
        Files.createDirectories(dir);
        String name = "backup-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".sql";
        Path file = dir.resolve(name).toAbsolutePath();

        // H2 SCRIPT command
        jdbc.execute("SCRIPT TO '" + file.toString().replace("'", "''") + "'");

        FileSystemResource resource = new FileSystemResource(file.toFile());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(org.springframework.http.ContentDisposition
                .attachment().filename(name).build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/sql"))
                .contentLength(resource.contentLength())
                .body(resource);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> doImport(@RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "wipe", defaultValue = "true") boolean wipe) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }
        Path dir = Paths.get(backupDir);
        Files.createDirectories(dir);
        File tmp = File.createTempFile("import-", ".sql", dir.toFile());
        file.transferTo(tmp);
        try {
            if (wipe) {
                jdbc.execute("DROP ALL OBJECTS");
            }
            jdbc.execute("RUNSCRIPT FROM '" + tmp.getAbsolutePath().replace("'", "''") + "'");
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        } finally {
            //noinspection ResultOfMethodCallIgnored
            tmp.delete();
        }
    }
}
