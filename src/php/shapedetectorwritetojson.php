<?php include("config.php");
	$postData = json_decode(file_get_contents("php://input"), TRUE);
	$id = $postData['id'];
  $jsonData = $postData['jsonData'];

  $json_file_path = '/home/eggbxhyo/cms.eggborne.com/shapedetector/brainjsmodels/shapemodel-' . strval($id) . '.json';
  $result = file_put_contents($json_file_path, stripslashes(json_encode($jsonData)));

  if ($result) {
    echo 'WROTE JSON';
  } else {
    echo 'write to JSON no bueno';
  }
	mysqli_close($link);
?>
