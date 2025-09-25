import Organization from "../models/organization.js";
import User from "../models/users.js";

// Получить все организации пользователя
const getUserOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({
      members: { $in: [req.user._id] }
    })
    .populate("members", "name email profilePicture role")
    .populate("admins", "name email profilePicture")
    .sort({ createdAt: -1 });

    res.json({ organizations });
  } catch (error) {
    console.error("Ошибка получения организаций:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Получить организацию по ID
const getOrganizationById = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await Organization.findById(organizationId)
      .populate("members", "name email profilePicture role")
      .populate("admins", "name email profilePicture");

    if (!organization) {
      return res.status(404).json({ message: "Организация не найдена" });
    }

    // Проверить, является ли пользователь участником организации
    const isMember = organization.members.some(
      member => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    res.json(organization);
  } catch (error) {
    console.error("Ошибка получения организации:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Обновить организацию
const updateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { name, description, color } = req.body;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({ message: "Организация не найдена" });
    }

    // Проверить, является ли пользователь администратором организации
    const isAdmin = organization.admins.some(
      admin => admin.toString() === req.user._id.toString()
    ) || req.user.role === "admin";

    if (!isAdmin) {
      return res.status(403).json({ message: "Доступ запрещен. Только администраторы могут редактировать организацию." });
    }

    // Обновить поля
    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;
    if (color) organization.color = color;

    await organization.save();

    // Получить обновленную организацию с populated полями
    const updatedOrganization = await Organization.findById(organizationId)
      .populate("members", "name email profilePicture role")
      .populate("admins", "name email profilePicture");

    res.json(updatedOrganization);
  } catch (error) {
    console.error("Ошибка обновления организации:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Создать организацию
const createOrganization = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Проверить права доступа (только админы могут создавать организации)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Доступ запрещен. Только администраторы могут создавать организации." });
    }

    const newOrganization = await Organization.create({
      name,
      description,
      color: color || "#3b82f6",
      admins: [req.user._id],
      members: [req.user._id],
      createdBy: req.user._id,
    });

    // Получить созданную организацию с populated полями
    const populatedOrganization = await Organization.findById(newOrganization._id)
      .populate("members", "name email profilePicture role")
      .populate("admins", "name email profilePicture");

    res.status(201).json(populatedOrganization);
  } catch (error) {
    console.error("Ошибка создания организации:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Добавить участника в организацию
const addMemberToOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId } = req.body;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({ message: "Организация не найдена" });
    }

    // Проверить права доступа
    const isAdmin = organization.admins.some(
      admin => admin.toString() === req.user._id.toString()
    ) || req.user.role === "admin";

    if (!isAdmin) {
      return res.status(403).json({ message: "Доступ запрещен. Только администраторы могут добавлять участников." });
    }

    // Проверить, существует ли пользователь
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверить, не является ли пользователь уже участником
    if (organization.members.includes(userId)) {
      return res.status(400).json({ message: "Пользователь уже является участником организации" });
    }

    // Добавить пользователя
    organization.members.push(userId);
    await organization.save();

    // Получить обновленную организацию
    const updatedOrganization = await Organization.findById(organizationId)
      .populate("members", "name email profilePicture role")
      .populate("admins", "name email profilePicture");

    res.json(updatedOrganization);
  } catch (error) {
    console.error("Ошибка добавления участника:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Удалить участника из организации
const removeMemberFromOrganization = async (req, res) => {
  try {
    const { organizationId, userId } = req.params;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({ message: "Организация не найдена" });
    }

    // Проверить права доступа
    const isAdmin = organization.admins.some(
      admin => admin.toString() === req.user._id.toString()
    ) || req.user.role === "admin";

    if (!isAdmin) {
      return res.status(403).json({ message: "Доступ запрещен. Только администраторы могут удалять участников." });
    }

    // Удалить пользователя из участников
    organization.members = organization.members.filter(
      member => member.toString() !== userId
    );

    // Также удалить из администраторов, если он там есть
    organization.admins = organization.admins.filter(
      admin => admin.toString() !== userId
    );

    await organization.save();

    // Получить обновленную организацию
    const updatedOrganization = await Organization.findById(organizationId)
      .populate("members", "name email profilePicture role")
      .populate("admins", "name email profilePicture");

    res.json(updatedOrganization);
  } catch (error) {
    console.error("Ошибка удаления участника:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  createOrganization,
  addMemberToOrganization,
  removeMemberFromOrganization,
};
