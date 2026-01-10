
import React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { CATEGORIES } from '../constants';

const Search: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold">Search</h1>
      
      <div className="relative sticky top-0 md:static z-30">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="text-zinc-500" size={20} />
        </div>
        <input 
          type="text" 
          placeholder="What do you want to listen to?" 
          className="w-full bg-white text-black py-3 pl-10 pr-4 rounded-full font-medium focus:outline-none placeholder-zinc-500"
        />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Browse all</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((category) => (
          <div 
            key={category.id} 
            className={`${category.color} aspect-[3/2] md:aspect-square p-4 rounded-lg relative overflow-hidden hover:scale-[1.02] transition cursor-pointer group`}
          >
            <span className="text-xl font-bold">{category.name}</span>
            <img 
              src={`https://picsum.photos/seed/${category.id}/200/200`} 
              alt="" 
              className="absolute -bottom-4 -right-4 w-24 h-24 md:w-32 md:h-32 rotate-[25deg] shadow-xl group-hover:rotate-[15deg] transition duration-300" 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
