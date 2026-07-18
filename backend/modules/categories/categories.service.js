import categoryRepository from './categories.repository.js';
import ApiError from '../../utils/ApiError.js';

class CategoryService {
  async createCategory(data) {
    const exists = await categoryRepository.findByCategoryName(data.categoryName);
    if (exists) throw new ApiError(400, 'Category name already exists');
    return categoryRepository.create(data);
  }

  async getAllCategories() {
    return categoryRepository.findAll();
  }

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }

  async updateCategory(id, data) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    if (data.categoryName && data.categoryName !== category.categoryName) {
      const exists = await categoryRepository.findByCategoryName(data.categoryName);
      if (exists) throw new ApiError(400, 'Category name already exists');
    }
    return categoryRepository.update(id, data);
  }

  async deleteCategory(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    if (category._count.vehicles > 0) {
      throw new ApiError(400, 'Cannot delete category with associated vehicles. Disable it instead.');
    }
    await categoryRepository.delete(id);
    return true;
  }
}

export default new CategoryService();
