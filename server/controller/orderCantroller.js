var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {
  Order,
  OrderProduct,
  User,
  Parametr,
  ProductParametrItem,
  ProductParametr,
  Product,
  ProductImg,
  ProductVideo,
  Category,
  Brand,
  Orderlog,
  Market,
} = require("../../models/index.js");

const fs = require("fs");
const orderlog = require("../../models/orderlog");

const getAll = async (req, res) => {
  const { status, code, admin_note, active, deleted, UserId, name } = req.query;

  const Name =
    name && name.length > 0
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${name}%` } },
            { lastname: { [Op.iLike]: `%${name}%` } },
            { phone: { [Op.iLike]: `%${name}%` } },
            { note: { [Op.iLike]: `%${name}%` } },
            { address: { [Op.iLike]: `%${name}%` } },
          ],
        }
      : null;
  const UserID = UserId ? { UserId: UserId } : null;
  const Status =
    status &&
    (status?.length > 0
      ? {
          status: { [Op.iLike]: `%${status}%` },
        }
      : null);
  const Code =
    code &&
    (code?.length > 0
      ? {
          code: { [Op.iLike]: `%${code}%` },
        }
      : null);
  const Admin_note =
    admin_note &&
    (admin_note?.length > 0
      ? {
          admin_note: { [Op.iLike]: `%${admin_note}%` },
        }
      : null);
  const Active =
    active &&
    (active
      ? {
          active: active,
        }
      : {
          active: true,
        });
  const Deleted =
    deleted &&
    (deleted
      ? {
          deleted: deleted,
        }
      : {
          deleted: false,
        });

  Order.findAll({
    include: [
      {
        model: User,
      },
      {
        model: OrderProduct,
        include: [
          {
            model: Product,
            include: [
              {
                model: ProductImg,
              },
              {
                model: ProductVideo,
              },
              {
                model: Category,
              },
              {
                model: Brand,
              },
              {
                model: Brand,
              },
              {
                model: ProductParametr,
                include: [
                  { model: Product },
                  { model: Parametr },
                  { model: ProductParametrItem },
                ],
              },
            ],
          },
        ],
      },
    ],

    where: {
      [Op.and]: [Status, Name, UserID, Code, Admin_note, Active, Deleted],
    },
    order: [["id", "DESC"]],
  })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: err });
    });
};

const getOne = async (req, res) => {
  const { id } = req.params;
  const data = await Order.findOne({ where: { id: id } });
  if (data) {
    Order.findOne({
      include: [
        {
          model: User,
        },
        {
          model: OrderProduct,
          include: [
            {
              model: Product,
              include: [
                {
                  model: ProductImg,
                },
                {
                  model: ProductVideo,
                },
                {
                  model: Category,
                },
                {
                  model: Brand,
                },
                {
                  model: Brand,
                },
                {
                  model: ProductParametr,
                  include: [
                    { model: Product },
                    { model: Parametr },
                    { model: ProductParametrItem },
                  ],
                },
              ],
            },
          ],
        },
      ],

      where: { id: id },
    })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        console.log(err);
        res.json({ error: err });
      });
  } else {
    res.send("BU ID boyuncha Order yok!");
  }
};

const create = async (req, res) => {
  const {
    name,
    lastname,
    phone,
    address,
    note,
    admin_note,
    delivery_type,
    delivery_price,
    UserId,
    orderProduct,
  } = req.body;

  const market = await Market.findOne();
  let orderedProducts = [];
  var price = 0;
  var discount_price = 0;
  var came_price = 0;
  console.log(
    "price>>>>>>",
    price,
    "\n",
    "discount >>>>>>>",
    discount_price,
    "came price=>>>",
    came_price
  );
  await orderProduct?.map(async (item) => {
    const product = await Product.findOne({ where: { id: item.ProductId } });

    let camePrice = product?.is_valyuta
      ? (product?.came_price * market?.valyuta * item?.quantity).toFixed(0)
      : (product?.came_price * item?.quantity).toFixed(0);

    came_price = came_price + camePrice;

    let proPrice = product?.is_valyuta
      ? (product?.price * market?.valyuta * item?.quantity).toFixed(0)
      : (product?.price * item?.quantity).toFixed(0);

    price = +price + +proPrice;

    let proDiscount_price = product?.is_valyuta
      ? product?.is_discount
        ? (product?.discount_price * market?.valyuta * item?.quantity).toFixed(
            0
          )
        : 0
      : product?.is_discount
      ? (product?.discount_price * item?.quantity).toFixed(0)
      : 0;

    discount_price = +discount_price + +proDiscount_price;

    orderedProducts.push({
      quantity: item?.quantity,
      price: proPrice,
      came_price: camePrice,
      discount_price: proDiscount_price,
      ProductId: product?.id,
      OrderId: 0,
    });

    console.log(
      "2price>>>>>>",
      price,
      "\n",
      "2discount >>>>>>>",
      discount_price,
      "\n came price::::",
      came_price
    );
  });
  console.log(
    "3price>>>>>>",
    price,
    "\n",
    "3discount >>>>>>>",
    discount_price,
    "\n came price::::",
    came_price
  );
  let sum_price = +price - (+price - +discount_price) + market.dastavka;
  await Order.create({
    price: +price,
    discount_price: +discount_price,
    came_price: +came_price,
    sum_price: sum_price,
    name,
    lastname,
    phone,
    address,
    note,
    admin_note,
    delivery_price: market?.dastavka,
    delivery_type,
    code: Math.floor(Math.random() * 9000000000) + 1000000000,
    UserId,
  })
    .then(async (data) => {
      await orderedProducts?.map(async (item) => {
        item.OrderId = data.id;
      });
      await Order.update(
        {
          price: +price,
          discount_price: +discount_price,
          came_price: +came_price,
          sum_price: +sum_price,
        },
        {
          where: {
            id: data.id,
          },
        }
      );
      await editStock(orderedProducts);
      OrderProduct.bulkCreate(orderedProducts, { returning: true })
        .then(async (ordered) => {
          orderedProducts = [];
          res.json({ order: data, orderedPro: ordered });
        })
        .catch((err) => {
          console.log(err);
          res.json("create OrderedPro:", err);
        });
    })
    .catch((err) => {
      console.log(err);
      res.json("create Order:", err);
    });
};

const update = async (req, res) => {
  const { status, code, address, note, admin_note, id } = req.body;

  const data = await Order.findOne({
    include: [{ model: OrderProduct }],
    where: { id: id },
  });
  if (status == "0") {
    editStockCancelOrder(data.OrderProduct);
  }
  if (!data) {
    res.json("Bu Id boyuncha Product yok!");
  } else {
    Order.update(
      {
        status,
        code,
        address,
        note,
        admin_note,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(async () => {
        res.json("updated");
      })
      .catch((err) => {
        console.log(err);
        res.json("update Order:", err);
      });
  }
};

const unDelete = async (req, res) => {
  const { id } = req.params;
  const data = await Order.findOne({
    include: [{ model: OrderProduct }],
    where: { id },
  });
  if (data) {
    Order.update({
      deleted: false,
      active: true,
      where: {
        id,
      },
    })
      .then(async () => {
        // await Orderlog.create({
        //   ipAddress: "",
        //   description: "Order undeleted",
        //   edited: JSON.stringify(data),
        //   oldData: JSON.stringify(data),
        //   OrderId: id,
        //   MarketId: data?.MarketId,
        //   // UserId:
        //   // AdminId:
        // });
        res.json("undeleted!");
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: err });
      });
  } else {
    res.json("Bu Id Boyuncha Order yok!");
  }
};

const Delete = async (req, res) => {
  const { id } = req.params;
  const data = await Order.findOne({
    include: [{ model: OrderProduct }],
    where: { id },
  });
  if (data) {
    Order.update({
      deleted: true,
      active: false,
      where: {
        id,
      },
    })
      .then(async () => {
        // await Orderlog.create({
        //   ipAddress: "",
        //   description: "Order deleted",
        //   edited: JSON.stringify(data),
        //   oldData: JSON.stringify(data),
        //   OrderId: id,
        //   MarketId: data?.MarketId,
        //   // UserId:
        //   // AdminId:
        // });
        res.json("deleted!");
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: err });
      });
  } else {
    res.json("Bu Id Boyuncha Order yok!");
  }
};

const Destroy = async (req, res) => {
  const { id } = req.params;
  const data = await Order.findOne({
    include: [{ model: OrderProduct }],
    where: { id },
  });
  if (data) {
    Order.destroy({
      where: {
        id,
      },
    })
      .then(async () => {
        // await Orderlog.create({
        //   ipAddress: "",
        //   description: "Order destroyed",
        //   edited: JSON.stringify(data),
        //   oldData: JSON.stringify(data),
        //   OrderId: id,
        //   MarketId: data?.MarketId,
        //   // UserId:
        //   // AdminId:
        // });
        res.json("destroyed!");
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: err });
      });
  } else {
    res.json("Bu Id Boyuncha Order yok!");
  }
};

const editStock = async (orderedPro) => {
  await orderedPro.map(async (item) => {
    const pro = await Product.findOne({ where: { id: item.ProductId } });
    if (pro.stock == item.quantity) {
      await Product.update(
        { stock: pro.stock - item.quantity, active: false },
        { where: { id: item.ProductId } }
      );
    } else {
      await Product.update(
        { stock: pro.stock - item.quantity },
        { where: { id: item.ProductId } }
      );
    }
  });
};

const editStockCancelOrder = async (orderedPro) => {
  await orderedPro.map(async (item) => {
    const pro = await Product.findOne({ where: { id: item.ProductId } });
    if (pro.stock == 0) {
      await Product.update(
        { stock: pro.stock + item.quantity, active: true },
        { where: { id: item.ProductId } }
      );
    } else {
      await Product.update(
        { stock: pro.stock + item.quantity },
        { where: { id: item.ProductId } }
      );
    }
  });
};

const Hasabat = async (req, res) => {
  const { status, active, deleted, start, end } = req.query;
  const Status =
    status &&
    (status?.length > 0
      ? {
          status: { [Op.iLike]: `%${status}%` },
        }
      : null);
  const Active =
    active &&
    (active
      ? {
          active: active,
        }
      : {
          active: true,
        });
  const Deleted =
    deleted &&
    (deleted
      ? {
          deleted: deleted,
        }
      : {
          deleted: false,
        });

  const Start = start
    ? {
        createdAt: { [Op.gte]: start },
      }
    : null;

  const End =
    end && end
      ? {
          createdAt: { [Op.lte]: end },
        }
      : null;

  Order.findAll({
    include: [
      {
        model: User,
      },
      {
        model: OrderProduct,
        include: [
          {
            model: Product,
            include: [
              {
                model: ProductImg,
              },
              {
                model: ProductVideo,
              },
              {
                model: Category,
              },
              {
                model: Brand,
              },
              {
                model: Brand,
              },
              {
                model: ProductParametr,
                include: [
                  { model: Product },
                  { model: Parametr },
                  { model: ProductParametrItem },
                ],
              },
            ],
          },
        ],
      },
    ],

    where: {
      [Op.and]: [Status, Active, Deleted, Start, End],
    },
    order: [["id", "DESC"]],
  })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: err });
    });
};

const HasabatUser = async (req, res) => {
  const { name, CategoryId, BrandId, limit, page, start, end } = req.query;

  const Page = page ? page : 0;
  const Limit = limit ? limit : 10;
  const Ofset = Page * Limit;

  const Start = start
    ? {
        createdAt: { [Op.gte]: start },
      }
    : null;

  const End =
    end && end
      ? {
          createdAt: { [Op.lte]: end },
        }
      : null;

  Order.findAll({
    attributes: [
      // "id",
      "UserId",
      "phone",
      // [
      //   (Sequelize.fn("sum", Sequelize.col("delivery_price")),
      //   "delivery_price_sum"),
      // ],
      [Sequelize.fn("sum", Sequelize.col("came_price")), "came_price_sum"],
      [Sequelize.fn("sum", Sequelize.col("price")), "price_sum"],
      [
        Sequelize.fn("sum", Sequelize.col("discount_price")),
        "discount_price_sum",
      ],
      // [
      //   Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")),
      //   "createdOn",
      // ],
      // [(Sequelize.fn("sum", Sequelize.col("id")), "OrderId_join")],
    ],
    group: ["UserId", "phone"],
    raw: true,
    // offset: Ofset,
    // limit: Limit,
  })
    .then(async (data) => {
      let array = [];
      let obj = {};
      await data.map(async (item) => {
        let user;
        let quantity = 0;
        if (item?.UserId) {
          user = await User.findOne({
            include: [
              {
                model: Order,
                include: [
                  {
                    model: OrderProduct,
                    include: [
                      {
                        model: Product,
                        include: [
                          {
                            model: ProductImg,
                          },
                          {
                            model: ProductVideo,
                          },
                          {
                            model: Category,
                          },
                          {
                            model: Brand,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],

            where: { id: item?.UserId },
          });
          await user?.Orders?.map((item1) => {
            item1?.OrderProducts?.map((itm) => {
              quantity = quantity + itm?.quantity;
            });
          });
          obj = {
            UserId: item?.UserId,
            quantity: quantity,
            came_price_sum: item?.came_price_sum,
            discount_price_sum: item?.discount_price_sum,
            price_sum: item?.price_sum,
            phone: item?.phone,
            User: user,
            Orders: user?.Orders,
          };
          array.push(obj);
        } else {
          const Orders = await Order.findAll({
            include: [
              {
                model: OrderProduct,
                include: [
                  {
                    model: Product,
                    include: [
                      {
                        model: ProductImg,
                      },
                      {
                        model: ProductVideo,
                      },
                      {
                        model: Category,
                      },
                      {
                        model: Brand,
                      },
                    ],
                  },
                ],
              },
            ],

            where: { phone: item?.phone },
          });

          await Orders?.map((item2) => {
            item2?.OrderProducts?.map((itm) => {
              quantity = quantity + itm?.quantity;
            });
          });
          obj = {
            UserId: item?.UserId,
            quantity: quantity,
            came_price_sum: item?.came_price_sum,
            discount_price_sum: item?.discount_price_sum,
            price_sum: item?.price_sum,
            phone: item?.phone,
            User: user,
            Orders: Orders,
          };
          array.push(obj);
        }

        if (array?.length == data?.length) {
          await array.sort((a, b) => b.quantity - a.quantity);
          res.json(array);
        }
      });

      // res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: err });
    });
};

// const HasabatUser = async (req, res) => {
//   const { name, CategoryId, BrandId, limit, page, start, end } = req.query;

//   const Page = page ? page : 0;
//   const Limit = limit ? limit : 10;
//   const Ofset = Page * Limit;

//   const Start = start
//     ? {
//         createdAt: { [Op.gte]: start },
//       }
//     : null;

//   const End =
//     end && end
//       ? {
//           createdAt: { [Op.lte]: end },
//         }
//       : null;

//   Order.findAll({
//     include: [
//       {
//         model: User,
//       },
//       {
//         model: OrderProduct,
//         include: [
//           {
//             model: Product,
//             include: [
//               {
//                 model: ProductImg,
//               },
//               {
//                 model: ProductVideo,
//               },
//               {
//                 model: Category,
//               },
//               {
//                 model: Brand,
//               },
//               {
//                 model: Brand,
//               },
//               {
//                 model: ProductParametr,
//                 include: [
//                   { model: Product },
//                   { model: Parametr },
//                   { model: ProductParametrItem },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//     ],
//     where: {
//       [Op.and]: [Start, End],
//     },
//     offset: Ofset,
//     limit: Limit,
//   })
//     .then(async (data) => {
//       // let array = [];
//       // await data.map(async (item) => {
//       //   let order = await Order.findOne({
//       //     include: [
//       //       {
//       //         model: User,
//       //       },
//       //       {
//       //         model: OrderProduct,
//       //         include: [
//       //           {
//       //             model: Product,
//       //             include: [
//       //               {
//       //                 model: ProductImg,
//       //               },
//       //               {
//       //                 model: ProductVideo,
//       //               },
//       //               {
//       //                 model: Category,
//       //               },
//       //               {
//       //                 model: Brand,
//       //               },
//       //               {
//       //                 model: Brand,
//       //               },
//       //               {
//       //                 model: ProductParametr,
//       //                 include: [
//       //                   { model: Product },
//       //                   { model: Parametr },
//       //                   { model: ProductParametrItem },
//       //                 ],
//       //               },
//       //             ],
//       //           },
//       //         ],
//       //       },
//       //     ],

//       //     where: { id: item?.OrderId },
//       //   });
//       //   let obj = {
//       //     OrderId: item?.OrderId,
//       //     came_price_sum: item?.came_price_sum,
//       //     discount_price_sum: item?.discount_price_sum,
//       //     price_sum: item?.price_sum,
//       //     quantity_sum: item?.quantity_sum,
//       //     Order: order,
//       //   };
//       //   array.push(obj);
//       //   console.log("obj:::::::::", obj);
//       //   if (array?.length == data?.length) {
//       //     await array.sort((a, b) => b.quantity_sum - a.quantity_sum);
//       //     res.json(array);
//       //   }
//       // });

//       res.json(data);
//     })
//     .catch((err) => {
//       console.log(err);
//       res.json({ error: err });
//     });
// };

exports.Hasabat = Hasabat;
exports.HasabatUser = HasabatUser;
exports.getAll = getAll;
exports.getOne = getOne;
exports.create = create;
exports.update = update;
exports.Delete = Delete;
exports.unDelete = unDelete;
exports.Destroy = Destroy;
