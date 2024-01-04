function initialUsers(){
    const users = [
        {
            username: "masteradmin",
            first_name: "Master",
            last_name: "Admin",
            hashedpass: "0856d1867dab0279ddaf07805a2d0a51ee77ab6c150999c720b3f46233ca854b498a5dd3a8615ec47880dd3dd6b910edf08effb2ec7f91baa405a0eb1ab62b27",
            salt: "ae6636058b37b064b660adf6ee5a50eb",
            admin: true,
            last_coin_claim: "2023-11-13 22:27:52.034",
            coins: 10000
        },
        {
            username: "testuser",
            first_name: "Test",
            last_name: "User",
            hashedpass: "48bc07d7248d08853a59df6feaa43adba22274ccc79cc7609af35a1f46df6f913e6011201d3c73272a8fe21d660586a07e46f513f796e05c73fc45931ea4bfb2",
            salt: "354e14c6298315152f1f242e34a24d30",
            admin: false,
            last_coin_claim: "2023-11-13 22:27:52.034",
            coins: 25000
        }
    ];
    return users;
}

function initialCards(){
    // text before description is 
    //"This is {card name}. Its a {card type} card."
    const cards = [
        // monster cards
        {
            name: "Winged Kuriboh",
            type: "monster",
            description: "He is your starter card. Be gentle with him, he's fragile.",
            image: "https://ms.yugipedia.com//thumb/a/a4/WingedKuriboh-SGX2-EN-C-1E.png/300px-WingedKuriboh-SGX2-EN-C-1E.png"
        },
        {
            name: "Winged Kuriboh LV10",
            type: "monster",
            description: "He is a stronger version of the original Winged Kuriboh. He is still fragile, but he can pack a punch.",
            image: "https://ms.yugipedia.com//thumb/b/bc/WingedKuribohLV10-AC19-EN-SR-1E.png/300px-WingedKuribohLV10-AC19-EN-SR-1E.png"
        },
        {
            name: "Baby Dragon",
            type: "monster",
            description: "He is a baby, so he is weak. But he can grow up to be a strong dragon.",
            image: "https://ms.yugipedia.com//thumb/8/89/BabyDragon-SBC1-EN-C-1E.png/300px-BabyDragon-SBC1-EN-C-1E.png"
        },
        {
            name: "Thousand Dragon",
            type: "monster",
            description: "The baby dragon used his magic to fuse with Time Wizard and become this powerful dragon.",
            image: "https://yugipedia.com/thumb.php?f=ThousandDragon-SBC1-EN-C-1E.png&w=300"
        },
        {
            name: "Time Wizard",
            type: "monster",
            description: "He is a wizard who can manipulate time. If you like gambling, he is the card for you.",
            image: "https://ms.yugipedia.com//thumb/e/e3/TimeWizard-SBC1-EN-C-1E.png/300px-TimeWizard-SBC1-EN-C-1E.png"
        },
        {
            name: "Dark Magician",
            type: "monster",
            description: "An iconic card from the original series. Known to be Yugi's favorite card.",
            image: "https://ms.yugipedia.com//thumb/0/0a/DarkMagician-LOB-EN-UR-UE-25thAnniversaryEdition.png/408px-DarkMagician-LOB-EN-UR-UE-25thAnniversaryEdition.png"
        },
        {
            name: "Dark Magician Girl",
            type: "monster",
            description: "A powerful magician who is a fan favorite. She is also a fan of the original Dark Magician.",
            image: "https://yugipedia.com/thumb.php?f=DarkMagicianGirl-SBC1-EN-C-1E.png&w=300"
        },
        {
            name: "Blue-Eyes White Dragon",
            type: "monster",
            description: "Once the most powerful card in the game. Known as Kaiba's favorite card.",
            image: "https://yugipedia.com/thumb.php?f=BlueEyesWhiteDragon-LC01-EN-UR-LE-25thAnniversaryEdition.png&w=300"
        },
        {
            name: "Blue-Eyes Ultimate Dragon",
            type: "monster",
            description: "A fusion of three Blue-Eyes White Dragons. If you managed to summon this card, you are a true duelist and Kaiba would be proud.",
            image: "https://yugipedia.com/thumb.php?f=BlueEyesUltimateDragon-GFP2-EN-GR-1E.png&w=300"
        },
        {
            name: "Obelisk the Tormentor",
            type: "monster",
            description: "One of the three Egyptian God Cards. Known as the God of Destruction. Fear him.",
            image: "https://yugipedia.com/thumb.php?f=ObelisktheTormentor-KICO-EN-URPR-1E.png&w=300"
        },

        // spell cards
        {
            name: "Monster Reborn",
            type: "spell",
            description: "A classic card that allows you to revive a monster from either player's graveyard. One of the most powerful spell cards in the game.",
            image: "https://ms.yugipedia.com//thumb/f/fb/MonsterReborn-LOB-EN-UR-UE-25thAnniversaryEdition.png/300px-MonsterReborn-LOB-EN-UR-UE-25thAnniversaryEdition.png"
        },
        {
            name: "Pot of Greed",
            type: "spell",
            description: "Controversial spell that allows you to draw two cards. It is banned in tournaments because it is too powerful.",
            image: "https://ms.yugipedia.com//thumb/5/50/PotofGreed-LOB-EN-R-UE-25thAnniversaryEdition.png/300px-PotofGreed-LOB-EN-R-UE-25thAnniversaryEdition.png"
        },
        {
            name: "Polymerization",
            type: "spell",
            description: "Some decks are built around this card, like Jaiden's Elemental Hero deck. It allows you to fuse two monsters together to create a stronger monster.",
            image: "https://ms.yugipedia.com//thumb/7/73/Polymerization-SBC1-EN-C-1E.png/300px-Polymerization-SBC1-EN-C-1E.png"
        },
        {
            name: "Graceful Charity",
            type: "spell",
            description: "Similar to Pot of Greed, but you have to discard two cards from your hand. It is also banned in tournaments.",
            image: "https://ms.yugipedia.com//thumb/a/af/GracefulCharity-BP02-EN-R-1E.png/300px-GracefulCharity-BP02-EN-R-1E.png"
        },
        {
            name: "Mystical Space Typhoon",
            type: "spell",
            description: "Sometimes your enemy has too powerful of a spell or trap card. This card allows you to destroy it.",
            image: "https://ms.yugipedia.com//thumb/f/fc/MysticalSpaceTyphoon-SRL-EN-UR-UE-25thAnniversaryEdition.png/300px-MysticalSpaceTyphoon-SRL-EN-UR-UE-25thAnniversaryEdition.png"
        },

        // trap cards
        {
            name: "Trap Hole",
            type: "trap",
            description: "A classic trap that allows you to destroy a monster with 1000 or more attack points. Make sure not to waste it on a weak monster.",
            image: "https://ms.yugipedia.com//thumb/1/11/TrapHole-LOB-EN-SR-UE-25thAnniversaryEdition.png/300px-TrapHole-LOB-EN-SR-UE-25thAnniversaryEdition.png"
        },
        {
            name: "Ring of Destruction",
            type: "trap",
            description: "It is as powerful as it sounds. It allows you to destroy a monster and inflict damage to both players equal to the destroyed monster's attack points. Watch out, you can destroy yourself with this card.",
            image: "https://yugipedia.com/thumb.php?f=RingofDestruction-LART-EN-UR-LE.png&w=300"
        },
        {
            name: "Magic Cylinder",
            type: "trap",
            description: "Iconic card that allows you to reflect an attack back to your opponent. It is a great way to turn the tables in a duel.",
            image: "https://ms.yugipedia.com//thumb/2/2d/MagicCylinder-SDRR-EN-C-1E.png/300px-MagicCylinder-SDRR-EN-C-1E.png"
        },
        {
            name: "Mirror Force",
            type: "trap",
            description: "Destroys all of your opponent's attack position monsters. Enough said.",
            image: "https://ms.yugipedia.com//thumb/e/e4/MirrorForce-MRD-EN-UR-UE-25thAnniversaryEdition.png/300px-MirrorForce-MRD-EN-UR-UE-25thAnniversaryEdition.png"
        },
        {
            name: "Waboku",
            type: "trap",
            description: "Great for when you need a turn to set up your strategy. It allows you to negate all battle damage for one turn.",
            image: "https://ms.yugipedia.com//thumb/6/63/Waboku-HAC1-EN-C-1E.png/300px-Waboku-HAC1-EN-C-1E.png"
        },
    ];
    return cards;
}

function initialOwnership(){
    const ownership = [
        // masteradmin
        {
            username: "masteradmin",
            card_name: "Dark Magician"
        },
        {
            username: "masteradmin",
            card_name: "Blue-Eyes White Dragon"
        },
        {
            username: "masteradmin",
            card_name: "Monster Reborn"
        },
        {
            username: "masteradmin",
            card_name: "Polymerization"
        },
        {
            username: "masteradmin",
            card_name: "Mirror Force"
        },
        {
            username: "masteradmin",
            card_name: "Trap Hole"
        },
        // testuser
        {
            username: "testuser",
            card_name: "Dark Magician Girl"
        },
        {
            username: "testuser",
            card_name: "Blue-Eyes Ultimate Dragon"
        },
        {
            username: "testuser",
            card_name: "Graceful Charity"
        },
        {
            username: "testuser",
            card_name: "Mystical Space Typhoon"
        },
        {
            username: "testuser",
            card_name: "Magic Cylinder"
        },
        {
            username: "testuser",
            card_name: "Waboku"
        }
    ];
    return ownership;
}


function initialTradeOffers(){
    trade_offers=[
        {
            username: "testuser",
            offering: ["Dark Magician Girl", "Blue-Eyes Ultimate Dragon"],
            wanting: ["Obelisk the Tormentor"]
        },
        {
            username: "testuser",
            offering: ["Graceful Charity"],
            wanting: ["Polymerization"]
        }
    ];
    return trade_offers;
}


module.exports = {
    initialUsers,
    initialCards,
    initialOwnership,
    initialTradeOffers
}