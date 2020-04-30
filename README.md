# MiPrimerJuegoDePalabras

Ejemplo para usar Alexa GameON

Simplemente crea una skill creada con ask new

Copia el modelo de lenguaje y el código lambda

Dale permisos a tu lambda para acceder a dynamo

Crea las siguientes variables de ambiente en tu lambda:

appBuildType : Development

gameAvatarBaseUrl : Source de imagenes (opcional)

gameOnApiKey : La public API Key que obtienes al crear el juego en gameon

leaderboardBackgroundImageUrl : La imágen de fondo para la tabla de posiciones

matchId : el MatchID de GameON

tournamentId : Este está tricky, lo sacas de la URL
