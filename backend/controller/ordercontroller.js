const A = require('../Middelwares/resolveandcatch')
const Order = require('../model/ordermodel')
const Wishlist = require('../model/wishlist')
const Bag = require('../model/bag')
const Errorhandler = require('../utilis/errorhandel')


exports.createorder = A(async (req, res, next) => {
    
    const {} = req.body
  
  })

exports.createwishlist = A(async (req, res, next) => {
   const {user, guestId, orderItems} = req.body
   
   // Identify if it's a registered user or a guest
   const query = user ? { user: user } : { guestId: guestId };
   
   const Finduser = await Wishlist.findOne(query)
    if (Finduser) {
      const product = Finduser.orderItems.find(item => item.product.toString() === orderItems[0].product.toString());
      
      if (product) {
        return next(new Errorhandler("Product already added in Wishlist", 400));
      } else {
        await Wishlist.updateOne(query, { $push: { orderItems: [orderItems[0]] } })
      }
      
    } else {
      await Wishlist.create({ ...req.body, ...query })
    }
    
    res.status(200).json({
      success: true,
    })
})

exports.getwishlist = A(async (req, res, next) => {
    const id = req.params.id;
    // Senior Engineer Tip: Check both user and guestId fields for the given ID
    const wishlist = await Wishlist.findOne({
      $or: [{ user: id }, { guestId: id }]
    }).populate('orderItems.product');

    res.status(200).json({
      success: true,
      wishlist,
      items: wishlist ? wishlist.orderItems : []
    })
})

exports.createbag = A(async (req, res, next) => {
  const {user, guestId, orderItems} = req.body
  const query = user ? { user: user } : { guestId: guestId };
  
  const FindBag = await Bag.findOne(query)
  
  if (FindBag) {
    const product = FindBag.orderItems.find(item => item.product.toString() === orderItems[0].product.toString());
    
    if (product) {
      return next(new Errorhandler("Product already added in Bag", 400));
    } else {
      await Bag.updateOne(query, { $push: { orderItems: [orderItems[0]] } })
    }
     
  } else {
    await Bag.create({ ...req.body, ...query })
  }
   
  res.status(200).json({
    success: true,
  })
})

 exports.getbag = A(async (req, res, next) => {
  const id = req.params.id;
  const bag = await Bag.findOne({
    $or: [{ user: id }, { guestId: id }]
  }).populate('orderItems.product')

  res.status(200).json({
    success: true,
    bag,
    items: bag ? bag.orderItems : []
  })
})

exports.updateqtybag = A(async (req, res, next) => {
 
  const {id, qty} = req.body
  
  const bag = await Bag.updateOne({'orderItems._id':id},{
    $set:{'orderItems.$.qty': qty}
  })

   res.status(200).json({
     success:true
     
 })
 
 })

 exports.deletebag = A(async (req, res, next) => {
  console.log(req.body)
  const {user, product} = req.body

  const users =  await Bag.updateOne({user: user}, {$pull:{
        orderItems: {product:product}
      }})
   
   res.status(200).json({
     success:true
     
 })
 
 })

 exports.deletewish = A(async (req, res, next) => {
  console.log(req.body)
  const {user, product} = req.body

  const users =  await Wishlist.updateOne({user: user}, {$pull:{
        orderItems: {product:product}
      }})

      console.log(users)
   
   res.status(200).json({
     success:true
     
 })
 
 })