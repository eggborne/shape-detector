<?php include("config.php");
	$postData = json_decode(file_get_contents("php://input"), TRUE);
  $trainingPatterns = $postData['trainingPatterns'];
  $id = $postData['id'];

  $userSql="UPDATE `shapeTypes` SET trainingPatterns='$trainingPatterns' WHERE id='$id';";
  $userResult=mysqli_query($link,$userSql);

  if ($userResult) {
    echo 'SHAPE TRAINING DATA SAVED :)';
  }
	mysqli_close($link);
?>
