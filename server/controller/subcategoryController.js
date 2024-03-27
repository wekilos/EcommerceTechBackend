var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {
  Category,
  SubCategory,
  Product,
  ProductImg,
  ProductVideo,
  ProductParametr,
  Parametr,
  ProductParametrItem,
} = require("../../models/index.js");

const fs = require("fs");

const getAll = async (req, res) => {
  const { name, active, deleted, is_favorite } = req.query;

  const Title =
    name &&
    (name?.length > 0
      ? {
          [Op.or]: [
            {
              name_tm: Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("name_tm")),
                "LIKE",
                "%" + name.toLowerCase() + "%"
              ),
            },
            {
              name_ru: Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("name_ru")),
                "LIKE",
                "%" + name.toLowerCase() + "%"
              ),
            },
            {
              name_en: Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("name_en")),
                "LIKE",
                "%" + name.toLowerCase() + "%"
              ),
            },
          ],
        }
      : null);

  const Favorite =
    is_favorite &&
    (is_favorite
      ? {
          is_favorite: is_favorite,
        }
      : { is_favorite: false });

  const Active = active
    ? {
        active: active,
      }
    : {
        active: true,
      };
  const Deleted = deleted
    ? {
        deleted: deleted,
      }
    : {
        deleted: false,
      };

  SubCategory.findAll({
    include: [
      { model: Category },
      {
        model: Product,
        // where: { [Op.and]: [{ active: "true" }, { deleted: "false" }] },
        where: { active: true },
        required: false,
        order: [["id", "DESC"]],
        include: [
          {
            model: ProductImg,
            order: [["orderNum", "ASC"]],
            // attributes: ["id", "orderNum"],
          },
          {
            model: ProductVideo,
          },
          {
            model: ProductParametr,
            include: [
              {
                model: Parametr,
              },
              {
                model: ProductParametrItem,
              },
            ],
          },
        ],
      },
    ],
    distinct: true,
    where: {
      [Op.and]: [Title, Active, Deleted, Favorite],
    },
    order: [["orderNum", "ASC"]],
  })
    .then(async (data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: err });
    });
};

const getOne = async (req, res) => {
  const { id } = req.params;
  const data = await SubCategory.findOne({ where: { id: id } });
  if (data) {
    SubCategory.findOne({
      include: [
        { model: Category },
        {
          model: Product,
          where: { [Op.and]: [{ active: true }, { deleted: false }] },
          required: false,
        },
      ],
      where: {
        id: id,
      },
    })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        console.log(err);
        res.json({ error: err });
      });
  } else {
    res.send("BU ID boyuncha SubCategory yok!");
  }
};

const create = async (req, res) => {
  const { name_tm, name_ru, name_en, is_favorite, orderNum } = req.body;

  const files = req?.files?.img;

  let randomNumber = Math.floor(Math.random() * 999999999999);
  let img_direction = `./uploads/category/` + randomNumber + `${files.name}`;
  fs.writeFile(img_direction, files.data, function (err) {
    console.log(err);
  });

  SubCategory.create({
    name_tm,
    name_ru,
    name_en,
    orderNum,
    img: img_direction,
    is_favorite,
  })
    .then(async (data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
      res.json("create SubCategory:", err);
    });
};

const update = async (req, res) => {
  const { name_tm, name_ru, name_en, orderNum, is_favorite, id } = req.body;
  const files = req?.files?.img;

  const data = await SubCategory.findOne({ where: { id: id } });
  if (!data) {
    res.json("Bu Id boyuncha SubCategory yok!");
  } else {
    let img_direction = data?.img;
    if (files) {
      fs.unlink(data?.img, function (err) {
        console.log(err);
      });
      let randomNumber = Math.floor(Math.random() * 999999999999);
      img_direction = `./uploads/category/` + randomNumber + `${files.name}`;
      fs.writeFile(img_direction, files.data, function (err) {
        console.log(err);
      });
    } else {
    }

    SubCategory.update(
      {
        name_tm,
        name_ru,
        name_en,
        orderNum,
        img: img_direction,
        is_favorite,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(async (data) => {
        res.json("updated");
      })
      .catch((err) => {
        console.log(err);
        res.json("update SubCategory:", err);
      });
  }
};

const unDelete = async (req, res) => {
  const { id } = req.params;
  let data = await SubCategory.findOne({ where: { id: id } });
  if (data) {
    SubCategory.update(
      {
        deleted: false,
        active: true,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(() => {
        res.json("undeleted!");
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: err });
      });
  } else {
    res.json("Bu Id Boyuncha SubCategory yok!");
  }
};

const Delete = async (req, res) => {
  const { id } = req.params;
  let data = await SubCategory.findOne({ where: { id: id } });
  if (data) {
    SubCategory.update(
      {
        deleted: true,
        active: false,
      },
      {
        where: {
          id: id,
        },
      }
    )
      .then(() => {
        res.json("deleted!");
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: err });
      });
  } else {
    res.json("Bu Id Boyuncha SubCategory yok!");
  }
};

const Destroy = async (req, res) => {
  const { id } = req.params;
  const data = await SubCategory.findOne({ where: { id: id } });
  if (data) {
    fs.unlink(data?.img, function (err) {
      console.log(err);
    });
    SubCategory.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        res.json("destroyed!");
      })
      .catch((err) => {
        console.log(err);
        res.json({ err: err });
      });
  } else {
    res.json("Bu Id Boyuncha SubCategory yok!");
  }
};
exports.getAll = getAll;
exports.getOne = getOne;
exports.create = create;
exports.update = update;
exports.Delete = Delete;
exports.unDelete = unDelete;
exports.Destroy = Destroy;
