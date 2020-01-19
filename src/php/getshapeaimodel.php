<?php include("config.php");
	$postData = json_decode(file_get_contents("php://input"), TRUE);
  $id = $postData['id'];

  $userSql="SELECT model FROM `shapeTypes` WHERE id='$id';";
  $userResult=mysqli_query($link,$userSql);

  if ($userResult) {
    echo json_encode(mysqli_fetch_array($userResult)[0]);
  }
	mysqli_close($link);
?>
