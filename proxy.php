<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Check if user ID is provided
if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id parameter']);
    exit;
}

$userId = $_GET['user_id'];
$shelf = isset($_GET['shelf']) ? $_GET['shelf'] : 'read'; // Default shelf

// Construct the Goodreads RSS URL
$rssUrl = "https://www.goodreads.com/review/list_rss/{$userId}?shelf={$shelf}";

// Initialize cURL session
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $rssUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'); // Goodreads might block requests without a user agent
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Execute cURL request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => "Failed to fetch data from Goodreads. HTTP Code: {$httpCode}"]);
    exit;
}

// Parse the XML
libxml_use_internal_errors(true);
$xml = simplexml_load_string($response);

if ($xml === false) {
    http_response_code(500);
    $errors = libxml_get_errors();
    libxml_clear_errors();
    echo json_encode(['error' => 'Failed to parse XML from Goodreads', 'details' => $errors]);
    exit;
}

// Convert XML to JSON format for the frontend
$books = [];

if (isset($xml->channel->item)) {
    foreach ($xml->channel->item as $item) {
        // Extract data
        $title = (string)$item->title;
        $author = (string)$item->author_name;
        $link = (string)$item->link;
        $imageUrl = (string)$item->book_image_url;
        $userRating = (int)$item->user_rating;
        $averageRating = (float)$item->average_rating;
        $readAt = (string)$item->user_read_at;

        $books[] = [
            'title' => $title,
            'author' => $author,
            'link' => $link,
            'imageUrl' => $imageUrl,
            'userRating' => $userRating,
            'averageRating' => $averageRating,
            'readAt' => $readAt
        ];
    }
}

echo json_encode(['shelf' => $shelf, 'userId' => $userId, 'books' => $books]);
?>
