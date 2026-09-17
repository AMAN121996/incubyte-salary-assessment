class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :full_name, null: false
      t.string :email, null: false
      t.string :job_title, null: false
      t.string :department, null: false
      t.string :country_code, limit: 2, null: false
      t.string :currency, limit: 3, null: false
      t.integer :salary, null: false
      t.date :hired_on, null: false

      t.timestamps

      t.check_constraint "salary > 0", name: "salary_positive"
    end

    add_index :employees, :email, unique: true
    add_index :employees, :full_name
    add_index :employees, :job_title
    add_index :employees, :department
    add_index :employees, %i[country_code job_title]
    add_index :employees, %i[country_code department]
    add_index :employees, %i[country_code salary]
  end
end
