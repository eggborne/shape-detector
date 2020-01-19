<?php include("config.php");
  $postData = json_decode(file_get_contents("php://input"), TRUE);
  $id = $postData['id'];

  $userSql="SELECT trainingPatterns FROM `shapeTypes` WHERE id='$id';";
  $userResult=mysqli_query($link,$userSql);

  if ($userResult) {
    echo json_encode(mysqli_fetch_array($userResult,MYSQLI_ASSOC)['trainingPatterns']);
  }
	mysqli_close($link);
?>
