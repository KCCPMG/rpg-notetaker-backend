const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const {issueToken, checkToken} = require('../config/authentication')
var router = express.Router();


router.use(checkToken);

// unverified
router.get('/:campaign_id', (req, res) => {
  console.log("incoming campaign request", req.params.campaign_id);
  console.log("User: ", req.user.id);
  Campaign.findById(req.params.campaign_id, (err, campaign) => {
    if (err) {
      console.log(err);
      res.send("Something went wrong");
    } else if (campaign===null) {
      console.log("Campaign not found");
      res.send("Campaign not found")
    } else {
      if (!(campaign.players.includes(req.user._id))) {
        res.send("Not authorized");
      }
      else res.send({campaign});
    }
  })
})

// unverified
// had checkToken as middleware, removing due to router.use(checkToken) earlier
router.post('/new_campaign', checkToken, (req, res) => {
  console.log("\nincoming new campaign");
  let campaign = new Campaign(req.body.campaign);
  
  // console.log(req.user);
  campaign.createdBy = req.user.id;


  // Save campaign, *then* update user(s). Better to have a floating campaign than to have a dead link for the user in case anything goes wrong on either save

  console.log(campaign);

  // Make sure creator is included in players
  if (!campaign.players.includes(req.user.id)) campaign.players.push(req.user.id);



  let savePlayerPromise = (player) => {
    return new Promise((res, rej) => {
      if (!player.campaigns.includes(campaign._id)) {
        player.campaigns.push(campaign._id);
      } 
      player.save((err)=>{
        if (err) {
          console.log(err);
          rej(`Error saving ${player._id}`)
        } else res();
      });
    })
  }


  findPlayerPromises = () => {
    let playerIds = campaign.players;
    return new Promise((res, rej) => {
      Promise.all(playerIds.map(id => User.findById(id)))
      .then((players) => {
        console.log(players);
        res(players)
      })
      .catch((err) => {
        rej(err)
      });
    })
  }

  let campaignSave = new Promise((res, rej) => {
    campaign.save((err) => {
      if (err) rej(err);
      else res();
    })
  })

  campaignSave
  .then(findPlayerPromises)
  .then((players)=>{
    return new Promise((resolve, reject) => {
      console.log(players);
      Promise.all(players.map((player) => {
        return savePlayerPromise(player)
      }))
      .then(() => {resolve()})
      .catch((e) => reject(e));
    })
  })
  .then(() => {
    res.send("Campaign Saved");
  })
  .catch((e) => {
    console.log(e);
    res.send("Something went wrong");
  })

})

// unverified
router.post('/new_journal', (req, res) => {
  Campaign.findById(req.body.campaign_id, (err, campaign) => {
    if (err) res.send("Something went wrong");
    else if (!campaign) res.send("Campaign not found");
    else {
      if (!(campaign.characters.includes(req.user._id))) {
        res.send("Not authorized");
      } else {
        let journalID = Math.max(campaign.jorunals.map(c => c.id))+1
      }
    }
    
  });
})

module.exports = router;