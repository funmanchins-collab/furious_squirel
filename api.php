<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_name('belka_admin');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'path' => '/',
]);
session_start();

function jsonResponse(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function readJsonFile(string $path, array $fallback): array {
    if (!is_file($path)) return $fallback;
    $raw = @file_get_contents($path);
    if ($raw === false || trim($raw) === '') return $fallback;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $fallback;
}

function saveJsonFile(string $path, array $data): void {
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) throw new RuntimeException('Не удалось сформировать JSON.');
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) throw new RuntimeException('Не удалось создать каталог данных.');
    if (is_file($path)) @copy($path, $path . '.bak');
    $tmp = $path . '.tmp-' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $json . PHP_EOL, LOCK_EX) === false) throw new RuntimeException('Не удалось записать временный файл данных.');
    @chmod($tmp, 0644);
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        throw new RuntimeException('Не удалось заменить файл данных.');
    }
}

function loadData(): array {
    return readJsonFile(DATA_FILE, []);
}


function normalizeSavedSchedule(array $data): array {
    $trainers = (array)($data['trainers'] ?? []);
    $registry = [];

    $norm = static function(string $value): string {
        $value = mb_strtolower(trim($value), 'UTF-8');
        $value = str_replace(['ё'], ['е'], $value);
        $value = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $value) ?? '';
        return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    };

    foreach ($trainers as $i => $trainer) {
        $full = trim((string)($trainer['name'] ?? ''));
        if ($full === '') continue;
        $parts = preg_split('/\s+/u', $norm($full), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $registry[] = [
            'index' => $i,
            'full' => $full,
            'norm' => $norm($full),
            'first' => $parts[0] ?? '',
            'last' => $parts[count($parts)-1] ?? ($parts[0] ?? '')
        ];
    }

    $resolve = static function(string $raw) use ($registry, $norm): array {
        $key = $norm($raw);
        if ($key === '') return ['ok'=>false, 'reason'=>'empty'];

        $exact = array_values(array_filter($registry, static fn($t) => $t['norm'] === $key));
        if (count($exact) === 1) return ['ok'=>true, 'trainer'=>$exact[0]];

        $matches = array_values(array_filter($registry, static fn($t) => $t['first'] === $key || $t['last'] === $key));
        if (count($matches) === 1) return ['ok'=>true, 'trainer'=>$matches[0]];
        if (count($matches) > 1) return ['ok'=>false, 'reason'=>'ambiguous'];
        return ['ok'=>false, 'reason'=>'not_found'];
    };

    $days = ['пн'=>0,'понедельник'=>0,'вт'=>1,'вторник'=>1,'ср'=>2,'среда'=>2,'чт'=>3,'четверг'=>3,'пт'=>4,'пятница'=>4,'сб'=>5,'суббота'=>5,'вс'=>6,'воскресенье'=>6];
    $dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    $timeValue = static function($value): int {
        if (preg_match('/(\d{1,2})\s*:\s*(\d{2})/u', (string)$value, $m)) return ((int)$m[1])*60+(int)$m[2];
        return 9999;
    };

    $rows = [];
    foreach ((array)($data['schedule'] ?? []) as $index => $row) {
        if (!is_array($row)) continue;
        $row = array_values($row);
        $row[0] = (string)($row[0] ?? '');
        $dayKey = $norm($row[0]);
        if (!array_key_exists($dayKey, $days)) {
            throw new RuntimeException('В расписании указано неизвестное значение дня недели в строке '.($index+1).'. Используйте Пн, Вт, Ср, Чт, Пт, Сб или Вс.');
        }
        $row[0] = $dayNames[$days[$dayKey]];

        $coach = trim((string)($row[3] ?? ''));
        $result = $resolve($coach);
        if (!$result['ok']) {
            if (($result['reason'] ?? '') === 'ambiguous') {
                throw new RuntimeException('Тренер «'.$coach.'» совпадает с несколькими тренерами. Укажите полное имя и фамилию.');
            }
            throw new RuntimeException('Тренер «'.$coach.'» не найден в разделе «Тренеры». Сначала добавьте этого тренера там.');
        }
        $row[3] = $result['trainer']['full'];
        $rows[] = $row;
    }

    usort($rows, static function($a,$b) use ($days,$norm,$timeValue): int {
        $da = $days[$norm((string)($a[0] ?? ''))] ?? 99;
        $db = $days[$norm((string)($b[0] ?? ''))] ?? 99;
        if ($da !== $db) return $da <=> $db;
        $ta = $timeValue($a[1] ?? '');
        $tb = $timeValue($b[1] ?? '');
        if ($ta !== $tb) return $ta <=> $tb;
        return strnatcasecmp((string)($a[3] ?? ''), (string)($b[3] ?? ''));
    });

    $data['schedule'] = $rows;
    return $data;
}

function saveSiteData(array $data): void {
    // Keep the public data structure untouched; this helper exists for media updates.
    saveJsonFile(DATA_FILE, $data);
}

function mediaOriginals(): array {
    return [
        'logo'=>'logo.png', 'price'=>'images/price/price.png',
        'heroLight'=>'images/backgrounds/hero-light.png', 'heroDark'=>'images/backgrounds/hero-dark.png',
        'trainersLight'=>'images/backgrounds/trainers-light.png', 'trainersDark'=>'images/backgrounds/trainers-dark.png',
        'commonLight'=>'images/backgrounds/common-light.png', 'commonDark'=>'images/backgrounds/common-dark.png',
        'eventsLight'=>'images/backgrounds/events-light.png', 'eventsDark'=>'images/backgrounds/events-dark.png'
    ];
}
function mediaFallback(string $key): string {
    $all=mediaOriginals(); return $all[$key] ?? '';
}
function mediaUploadProcess(string $tmp, string $originalName): string {
    $info=isAllowedImage($tmp);
    $dir=__DIR__.'/uploads/media';
    if (!is_dir($dir) && !mkdir($dir,0755,true)) jsonResponse(['ok'=>false,'error'=>'Не удалось создать uploads/media'],500);
    $name='media-'.gmdate('Ymd-His').'-'.bin2hex(random_bytes(6)).'.webp';
    $dest=$dir.'/'.$name;
    $processed=processWithPython($tmp,$dest,'webp');
    if (!$processed) $processed=processWithGd($tmp,$dest,$info['mime']);
    if (!$processed) {
        $ext=match($info['mime']){'image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif',default=>'bin'};
        $name='media-'.gmdate('Ymd-His').'-'.bin2hex(random_bytes(6)).'.'.$ext;
        $dest=$dir.'/'.$name;
        if (!move_uploaded_file($tmp,$dest)) jsonResponse(['ok'=>false,'error'=>'Не удалось сохранить изображение'],500);
    }
    return 'uploads/media/'.$name;
}
function safeManagedMediaPath(string $path): ?string {
    if (!str_starts_with($path,'uploads/media/')) return null;
    $full=__DIR__.'/'.$path;
    $real=realpath($full); $base=realpath(__DIR__.'/uploads/media');
    if (!$real || !$base || !str_starts_with($real,$base.DIRECTORY_SEPARATOR)) return null;
    return $real;
}

function loadGallery(): array {
    $stored = readJsonFile(GALLERY_FILE, []);
    if (count($stored) !== 6 || !array_is_list($stored)) {
        $legacy = loadData()['gallery'] ?? [];
        $titles = ['Тренировка на трассе','Прохождение препятствий','Работа на рукоходе','Ninja Kids','На соревнованиях','Наша команда'];
        $stored=[];
        for($i=0;$i<6;$i++){
            $legacySrc=(string)($legacy[$i]['src'] ?? ('images/galery/'.($i+1).'.jpg'));
            $legacySrc=preg_replace('#^images/([1-6]\.jpg)$#','images/galery/$1',$legacySrc);
            $stored[]=['id'=>'album-'.($i+1),'title'=>$titles[$i],'photos'=>[[
                'path'=>$legacySrc,'alt'=>(string)($legacy[$i]['alt']??$titles[$i]),'caption'=>(string)($legacy[$i]['caption']??$titles[$i]),'created_at'=>'legacy','managed'=>false
            ]]];
        }
        saveJsonFile(GALLERY_FILE,$stored);
    }
    $changed=false; $legacyPaths=[];
    for($i=0;$i<6;$i++) $legacyPaths[]='images/galery/'.($i+1).'.jpg';
    foreach($stored as $i=>&$album){
        $before=$album['photos']??[]; $photos=[];
        foreach((array)$before as $photo){
            if(!is_array($photo)||empty($photo['path'])){ $changed=true; continue; }
            $path=(string)$photo['path'];
            if(!empty($photo['managed']) && str_starts_with($path,'uploads/gallery/') && !is_file(__DIR__.'/'.$path)){ $changed=true; continue; }
            $photos[]=$photo;
        }
        $photos=array_values(array_slice($photos,-MAX_GALLERY_PHOTOS));
        if(!$photos){
            $title=trim((string)($album['title']??('Альбом '.($i+1))));
            $photos=[['path'=>$legacyPaths[$i],'alt'=>$title,'caption'=>$title,'created_at'=>'legacy','managed'=>false]];
            $changed=true;
        }
        if(count($before)!==count($photos) || ($before && json_encode($before)!==json_encode($photos))) $changed=true;
        $album['photos']=$photos;
        $album['id']='album-'.($i+1);
    }
    unset($album);
    if($changed) saveJsonFile(GALLERY_FILE,$stored);
    return $stored;
}

function requireAdmin(): void {
    if (empty($_SESSION['admin'])) jsonResponse(['ok'=>false,'error'=>'Требуется вход'], 401);
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function requireCsrf(): void {
    $token = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), $token)) jsonResponse(['ok'=>false,'error'=>'CSRF token invalid'], 419);
}

function sanitizeAlbumIndex(mixed $value): int {
    $i = filter_var($value, FILTER_VALIDATE_INT);
    if ($i === false || $i < 0 || $i > 5) jsonResponse(['ok'=>false,'error'=>'Некорректный альбом'], 400);
    return $i;
}

function isAllowedImage(string $tmp): array {
    $info = @getimagesize($tmp);
    if (!$info || empty($info['mime'])) jsonResponse(['ok'=>false,'error'=>'Файл не является изображением'], 400);
    $allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!in_array($info['mime'], $allowed, true)) jsonResponse(['ok'=>false,'error'=>'Поддерживаются JPG, PNG, WEBP и GIF'], 400);
    return $info;
}

function uniqueGalleryName(string $extension): string {
    return gmdate('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
}

function processWithPython(string $source, string $destination, string $extension): bool {
    $script = __DIR__ . '/tools/image_processor.py';
    $pythonCandidates = ['python3', '/usr/bin/python3', '/opt/homebrew/bin/python3'];
    foreach ($pythonCandidates as $python) {
        $check = trim((string)@shell_exec('command -v ' . escapeshellarg($python) . ' 2>/dev/null'));
        if ($check === '' && !str_contains($python, '/')) continue;
        $command = escapeshellarg($python) . ' ' . escapeshellarg($script) . ' ' . escapeshellarg($source) . ' ' . escapeshellarg($destination);
        @exec($command, $out, $code);
        if ($code === 0 && is_file($destination) && filesize($destination) > 0) return true;
    }
    return false;
}

function processWithGd(string $source, string $destination, string $mime): bool {
    if (!function_exists('imagecreatefromjpeg')) return false;
    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($source),
        'image/png' => @imagecreatefrompng($source),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($source) : false,
        'image/gif' => @imagecreatefromgif($source),
        default => false,
    };
    if (!$src) return false;
    $w = imagesx($src); $h = imagesy($src);
    $max = 2200;
    $scale = ($w > $max || $h > $max) ? min($max/$w, $max/$h) : 1;
    $nw = max(1, (int)round($w*$scale)); $nh = max(1, (int)round($h*$scale));
    $dst = imagecreatetruecolor($nw, $nh);
    imagealphablending($dst, false); imagesavealpha($dst, true);
    imagecopyresampled($dst, $src, 0,0,0,0,$nw,$nh,$w,$h);
    $ok = function_exists('imagewebp') ? @imagewebp($dst, $destination, 84) : false;
    imagedestroy($src); imagedestroy($dst);
    return (bool)$ok;
}

$action = (string)($_GET['action'] ?? $_POST['action'] ?? '');

if ($action === 'public' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = loadData();
    $data['galleryAlbums'] = loadGallery();
    $serviceMeta = readJsonFile(__DIR__ . '/storage/service-meta.json', []);
    jsonResponse(['ok'=>true,'data'=>$data,'serviceMeta'=>$serviceMeta]);
}

if ($action === 'publicGallery' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse(['ok'=>true,'albums'=>loadGallery(),'static'=>loadData()['static'] ?? []]);
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!adminConfigured()) jsonResponse(['ok'=>false,'error'=>'Админка ещё не настроена. Откройте /install.php.'], 503);
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $password = (string)($input['password'] ?? '');
    global $ADMIN_PASSWORD_HASH;
    if (!password_verify($password, $ADMIN_PASSWORD_HASH)) { usleep(350000); jsonResponse(['ok'=>false,'error'=>'Неверный пароль'], 403); }
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    jsonResponse(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
}

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time()-42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
    jsonResponse(['ok'=>true]);
}

if ($action === 'admin' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdmin();
    jsonResponse(['ok'=>true,'data'=>loadData(),'gallery'=>loadGallery(),'serviceMeta'=>readJsonFile(__DIR__.'/storage/service-meta.json',[]),'csrf'=>$_SESSION['csrf'],'configured'=>adminConfigured()]);
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) jsonResponse(['ok'=>false,'error'=>'Некорректный JSON'], 400);
    try { $input = normalizeSavedSchedule($input); saveJsonFile(DATA_FILE, $input); jsonResponse(['ok'=>true]); }
    catch (Throwable $e) { jsonResponse(['ok'=>false,'error'=>$e->getMessage()], 422); }
}


if ($action === 'mediaUpload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    if (!isset($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) jsonResponse(['ok'=>false,'error'=>'Выберите изображение'],400);
    if (($_FILES['image']['size'] ?? 0) > MAX_UPLOAD_BYTES) jsonResponse(['ok'=>false,'error'=>'Файл слишком большой. Максимум 10 МБ.'],400);
    $kind=(string)($_POST['kind'] ?? 'fixed');
    $index=filter_var($_POST['index'] ?? null,FILTER_VALIDATE_INT);
    $key=(string)($_POST['key'] ?? '');
    $data=loadData();
    $meta=readJsonFile(__DIR__.'/storage/service-meta.json',[]);
    $path=mediaUploadProcess($_FILES['image']['tmp_name'], (string)($_FILES['image']['name'] ?? 'image'));
    $old='';
    if ($kind==='fixed') {
        $orig=mediaOriginals();
        if (!isset($orig[$key])) { @unlink(__DIR__.'/'.$path); jsonResponse(['ok'=>false,'error'=>'Неизвестный медиаресурс'],400); }
        $old=(string)($data['media'][$key] ?? '');
        $data['media'][$key]=$path;
    } elseif ($kind==='trainer') {
        if ($index===false || $index<0 || !isset($data['trainers'][$index])) { @unlink(__DIR__.'/'.$path); jsonResponse(['ok'=>false,'error'=>'Тренер не найден'],400); }
        $old=(string)($data['trainers'][$index]['image'] ?? ''); $data['trainers'][$index]['image']=$path;
    } elseif ($kind==='service') {
        if ($index===false || $index<0 || !array_key_exists($index,$meta)) { @unlink(__DIR__.'/'.$path); jsonResponse(['ok'=>false,'error'=>'Услуга не найдена'],400); }
        $old=(string)($meta[$index]['image'] ?? ''); $meta[$index]['image']=$path;
    } else { @unlink(__DIR__.'/'.$path); jsonResponse(['ok'=>false,'error'=>'Неизвестный тип медиаресурса'],400); }
    try {
        saveSiteData($data);
        if ($kind==='service') saveJsonFile(__DIR__.'/storage/service-meta.json',$meta);
        if ($old && ($managed=safeManagedMediaPath($old))) @unlink($managed);
        jsonResponse(['ok'=>true,'data'=>$data,'serviceMeta'=>$meta,'path'=>$path]);
    } catch(Throwable $e) { @unlink(__DIR__.'/'.$path); jsonResponse(['ok'=>false,'error'=>$e->getMessage()],500); }
}

if ($action === 'mediaDelete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input=json_decode(file_get_contents('php://input'),true)?:[];
    $kind=(string)($input['kind']??'fixed'); $index=filter_var($input['index']??null,FILTER_VALIDATE_INT); $key=(string)($input['key']??'');
    $data=loadData(); $meta=readJsonFile(__DIR__.'/storage/service-meta.json',[]); $old='';
    if ($kind==='fixed') {
        if (!array_key_exists($key,mediaOriginals())) jsonResponse(['ok'=>false,'error'=>'Неизвестный медиаресурс'],400);
        $old=(string)($data['media'][$key]??''); $data['media'][$key]=mediaFallback($key);
    } elseif ($kind==='trainer') {
        if ($index===false || $index<0 || !isset($data['trainers'][$index])) jsonResponse(['ok'=>false,'error'=>'Тренер не найден'],400);
        $old=(string)($data['trainers'][$index]['image']??''); $data['trainers'][$index]['image']='images/treners/rushania.png';
    } elseif ($kind==='service') {
        if ($index===false || $index<0 || !array_key_exists($index,$meta)) jsonResponse(['ok'=>false,'error'=>'Услуга не найдена'],400);
        $old=(string)($meta[$index]['image']??''); $meta[$index]['image']=($index===0?'images/services/individual.png':'images/services/group.png');
    } else jsonResponse(['ok'=>false,'error'=>'Неизвестный тип медиаресурса'],400);
    saveSiteData($data); if($kind==='service') saveJsonFile(__DIR__.'/storage/service-meta.json',$meta);
    if($old && ($managed=safeManagedMediaPath($old))) @unlink($managed);
    jsonResponse(['ok'=>true,'data'=>$data,'serviceMeta'=>$meta]);
}

if ($action === 'serviceMetaSave' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input=json_decode(file_get_contents('php://input'),true);
    if(!is_array($input)) jsonResponse(['ok'=>false,'error'=>'Некорректные данные услуг'],400);
    saveJsonFile(__DIR__.'/storage/service-meta.json',$input);
    jsonResponse(['ok'=>true,'serviceMeta'=>$input]);
}

if ($action === 'gallerySave' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || count($input) !== 6) jsonResponse(['ok'=>false,'error'=>'Нужно сохранить ровно 6 альбомов'], 400);
    $gallery = [];
    foreach ($input as $i => $album) {
        if (!is_array($album)) jsonResponse(['ok'=>false,'error'=>'Некорректный альбом'],400);
        $photos = is_array($album['photos'] ?? null) ? array_slice($album['photos'],0,MAX_GALLERY_PHOTOS) : [];
        $gallery[] = [
            'id' => 'album-' . ($i+1),
            'title' => trim((string)($album['title'] ?? 'Альбом ' . ($i+1))),
            'photos' => array_values(array_filter($photos, fn($p)=>is_array($p) && !empty($p['path']))),
        ];
    }
    try { saveJsonFile(GALLERY_FILE, $gallery); jsonResponse(['ok'=>true,'gallery'=>$gallery]); }
    catch(Throwable $e){ jsonResponse(['ok'=>false,'error'=>$e->getMessage()],500); }
}

if ($action === 'uploadGallery' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $albumIndex = sanitizeAlbumIndex($_POST['album'] ?? -1);
    if (!isset($_FILES['images'])) jsonResponse(['ok'=>false,'error'=>'Фотографии не переданы'],400);
    $files = $_FILES['images'];
    $names = is_array($files['name'] ?? null) ? count($files['name']) : 0;
    if ($names < 1) jsonResponse(['ok'=>false,'error'=>'Выберите хотя бы одну фотографию'],400);
    $gallery = loadGallery();
    $added = [];
    for ($n=0; $n<$names; $n++) {
        if (($files['error'][$n] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
        if (($files['size'][$n] ?? 0) > MAX_UPLOAD_BYTES) continue;
        $tmp = $files['tmp_name'][$n] ?? '';
        if (!is_uploaded_file($tmp)) continue;
        $info = isAllowedImage($tmp);
        if (!is_dir(GALLERY_UPLOAD_DIR) && !mkdir(GALLERY_UPLOAD_DIR,0755,true)) jsonResponse(['ok'=>false,'error'=>'Не удалось создать uploads/gallery'],500);
        $name = uniqueGalleryName('webp');
        $destination = GALLERY_UPLOAD_DIR . '/' . $name;
        $processed = processWithPython($tmp, $destination, 'webp');
        if (!$processed) $processed = processWithGd($tmp, $destination, $info['mime']);
        if (!$processed) {
            $ext = match($info['mime']){'image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif',default=>'bin'};
            $name = uniqueGalleryName($ext); $destination = GALLERY_UPLOAD_DIR.'/'.$name;
            if (!move_uploaded_file($tmp,$destination)) continue;
        }
        $path = 'uploads/gallery/' . $name;
        $photo = ['path'=>$path,'alt'=>$files['name'][$n] ?? 'Фото клуба','caption'=>'','created_at'=>gmdate('c'),'managed'=>true];
        $gallery[$albumIndex]['photos'][] = $photo;
        $added[] = $photo;
    }
    $allPhotos = $gallery[$albumIndex]['photos'];
    $keptPhotos = array_values(array_slice($allPhotos, -MAX_GALLERY_PHOTOS));
    $removedPhotos = array_slice($allPhotos, 0, max(0, count($allPhotos) - MAX_GALLERY_PHOTOS));
    $gallery[$albumIndex]['photos'] = $keptPhotos;
    try {
        saveJsonFile(GALLERY_FILE,$gallery);
        foreach ($removedPhotos as $oldPhoto) {
            if (!empty($oldPhoto['managed']) && is_string($oldPhoto['path']) && str_starts_with($oldPhoto['path'],'uploads/gallery/')) {
                $oldPath = __DIR__ . '/' . $oldPhoto['path'];
                if (is_file($oldPath)) @unlink($oldPath);
            }
        }
        jsonResponse(['ok'=>true,'gallery'=>$gallery,'added'=>$added]);
    }
    catch(Throwable $e){ jsonResponse(['ok'=>false,'error'=>$e->getMessage()],500); }
}

if ($action === 'galleryDeletePhoto' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $albumIndex = sanitizeAlbumIndex($input['album'] ?? -1);
    $photoIndex = filter_var($input['photo'] ?? null, FILTER_VALIDATE_INT);
    if ($photoIndex === false || $photoIndex < 0 || $photoIndex >= MAX_GALLERY_PHOTOS) jsonResponse(['ok'=>false,'error'=>'Некорректное фото'],400);
    $gallery = loadGallery();
    $photo = $gallery[$albumIndex]['photos'][$photoIndex] ?? null;
    if (!is_array($photo)) jsonResponse(['ok'=>false,'error'=>'Фото не найдено'],404);
    array_splice($gallery[$albumIndex]['photos'], $photoIndex, 1);
    if (!empty($photo['managed']) && is_string($photo['path']) && str_starts_with($photo['path'],'uploads/gallery/')) {
        $path = __DIR__ . '/' . $photo['path'];
        if (is_file($path)) @unlink($path);
    }
    try { saveJsonFile(GALLERY_FILE,$gallery); jsonResponse(['ok'=>true,'gallery'=>$gallery]); }
    catch(Throwable $e){ jsonResponse(['ok'=>false,'error'=>$e->getMessage()],500); }
}


if ($action === 'galleryEditPhoto' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input=json_decode(file_get_contents('php://input'),true)?:[];
    $albumIndex=sanitizeAlbumIndex($input['album']??-1);
    $photoIndex=filter_var($input['photo']??null,FILTER_VALIDATE_INT);
    if($photoIndex===false||$photoIndex<0||$photoIndex>=MAX_GALLERY_PHOTOS) jsonResponse(['ok'=>false,'error'=>'Некорректное фото'],400);
    $gallery=loadGallery(); $photo=$gallery[$albumIndex]['photos'][$photoIndex]??null;
    if(!is_array($photo)) jsonResponse(['ok'=>false,'error'=>'Фото не найдено'],404);
    $photo['alt']=substr(trim((string)($input['alt']??$photo['alt']??'')),0,240);
    $photo['caption']=substr(trim((string)($input['caption']??$photo['caption']??'')),0,480);
    $gallery[$albumIndex]['photos'][$photoIndex]=$photo;
    saveJsonFile(GALLERY_FILE,$gallery);
    jsonResponse(['ok'=>true,'gallery'=>$gallery]);
}

if ($action === 'galleryRename' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin(); requireCsrf();
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $albumIndex = sanitizeAlbumIndex($input['album'] ?? -1);
    $title = trim((string)($input['title'] ?? ''));
    if ($title === '') jsonResponse(['ok'=>false,'error'=>'Название альбома не может быть пустым'],400);
    $gallery = loadGallery();
    $gallery[$albumIndex]['title'] = substr($title, 0, 480);
    saveJsonFile(GALLERY_FILE,$gallery);
    jsonResponse(['ok'=>true,'gallery'=>$gallery]);
}

jsonResponse(['ok'=>false,'error'=>'Unknown action'],404);
