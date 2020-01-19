<?php include("config.php");
	$postData = json_decode(file_get_contents("php://input"), TRUE);
  $id = $postData['id'];
  $model = $postData['model'];

  $userSql="UPDATE `shapeTypes` SET model='$model' WHERE id='$id';";
  $userResult=mysqli_query($link,$userSql);

  if ($userResult) {
    echo 'SHAPE MODEL DATA SAVED :)';
  }
	mysqli_close($link);
?>
